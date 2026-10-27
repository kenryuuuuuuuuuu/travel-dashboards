/* 旅のしおり 専用Service Worker（templates/build_sw.py が旅行キー等を埋めて site/sw.js を作る）。
   - ページ本体（index.html）は「ネット優先・つながらないときだけ保存版」。
     保存版を優先すると、同じURLで次の旅行を公開しても古い旅程が出続けるため（2026-10 モンゴル版で発生）。
   - 画像などの同一サイト内ファイルは「保存版優先」（ファイル名に内容のハッシュが入っており古くならない）。
   - 地図タイル・経路計算・天気・フォント・CDN等の外部リソースには一切触れない（ネットワークに委ねる）。
   - このサイトの旧キャッシュ（tabi-shiori-*、旧形式の mongolia-guide-*）だけを片付け、他のサイトのキャッシュには触れない。 */
const CACHE_PREFIX = "tabi-shiori-taiwan-okinawa-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const BUILD_ID = "2026-10-27T20:44";
const CORE_ASSETS = ["./", "./index.html"];
const IMAGE_ASSETS = [];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "reload" });
        if (res && res.ok) await cache.put(url, res);
      } catch (e) { /* 圏外でのインストールは次回に持ち越し */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((k) => (k.startsWith("tabi-shiori-") && k !== CACHE_NAME) || k.startsWith("mongolia-guide-"))
      .map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isSameOrigin(url) {
  try { return new URL(url, self.location.href).origin === self.location.origin; } catch (e) { return false; }
}
function isPage(req) {
  if (req.mode === "navigate") return true;
  const path = new URL(req.url).pathname;
  return path.endsWith("/") || path.endsWith("/index.html");
}
function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    fetch(req).then((res) => { clearTimeout(timer); resolve(res); }, (err) => { clearTimeout(timer); reject(err); });
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !isSameOrigin(req.url)) return;

  if (isPage(req)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const res = await fetchWithTimeout(req, NETWORK_TIMEOUT_MS);
        if (res && res.ok) await cache.put("./index.html", res.clone());
        return res;
      } catch (e) {
        const saved = (await cache.match("./index.html")) || (await cache.match("./"));
        if (saved) return saved;
        throw e;
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    if (res && res.ok && res.type === "basic") cache.put(req, res.clone());
    return res;
  })());
});

// ガイドの「旅行用に保存する」：画像をまとめて保存する
self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "SAVE_FOR_TRIP") return;
  const port = event.ports && event.ports[0];
  event.waitUntil((async () => {
    let saved = 0;
    let failed = 0;
    try {
      const cache = await caches.open(CACHE_NAME);
      for (const url of CORE_ASSETS.concat(IMAGE_ASSETS)) {
        try {
          const res = await fetch(url, { cache: "reload" });
          if (res && res.ok) { await cache.put(url, res.clone()); saved++; } else { failed++; }
        } catch (e) { failed++; }
      }
      if (port) port.postMessage({ ok: failed === 0, imagesSaved: Math.max(0, saved - CORE_ASSETS.length), missingCount: failed });
    } catch (e) {
      if (port) port.postMessage({ ok: false, reason: String(e) });
    }
  })());
});
