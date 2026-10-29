/* 旅のしおり 専用Service Worker（templates/build_sw.py が旅行キー等を埋めて site/sw.js を作る）。
   - ページ本体（index.html）は「ネット優先・つながらないときだけ保存版」。
     保存版を優先すると、同じURLで次の旅行を公開しても古い旅程が出続けるため（2026-10 モンゴル版で発生）。
   - 画像などの同一サイト内ファイルは「保存版優先」（ファイル名に内容のハッシュが入っており古くならない）。
   - 地図タイル・経路計算・天気・フォント・CDN等の外部リソースには一切触れない（ネットワークに委ねる）。
   - このサイトの旧キャッシュ（tabi-shiori-*、旧形式の mongolia-guide-*）だけを片付け、他のサイトのキャッシュには触れない。 */
const CACHE_PREFIX = "tabi-shiori-taiwan-okinawa-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const BUILD_ID = "2026-10-29T20:13";
const CORE_ASSETS = ["./", "./index.html"];
const IMAGE_ASSETS = ["./assets/guide/a-taipei-80271205-640.webp", "./assets/guide/a-taipei-80271205-960.webp", "./assets/guide/a-taichung-c3f9e463-640.webp", "./assets/guide/a-taichung-c3f9e463-960.webp", "./assets/guide/a-tainan-2a28f188-640.webp", "./assets/guide/a-tainan-2a28f188-960.webp", "./assets/guide/a-kaohsiung-7aadbfca-640.webp", "./assets/guide/a-kaohsiung-7aadbfca-960.webp", "./assets/guide/a-naha-f5015015-640.webp", "./assets/guide/a-naha-f5015015-960.webp", "./assets/guide/a-chubu-2d56e22f-640.webp", "./assets/guide/a-chubu-2d56e22f-960.webp", "./assets/guide/f-beefnoodle-913b53f4-640.webp", "./assets/guide/f-beefnoodle-913b53f4-960.webp", "./assets/guide/f-rouzhou-70861763-640.webp", "./assets/guide/f-rouzhou-70861763-960.webp", "./assets/guide/f-mianxian-ce5849f7-640.webp", "./assets/guide/f-mianxian-ce5849f7-960.webp", "./assets/guide/s-temple-morning-456c1f94-640.webp", "./assets/guide/s-temple-morning-456c1f94-960.webp", "./assets/guide/f-lurou-market-c606d2bf-640.webp", "./assets/guide/f-lurou-market-c606d2bf-960.webp", "./assets/guide/s-curving-architecture-51903e13-640.webp", "./assets/guide/s-curving-architecture-51903e13-960.webp", "./assets/guide/f-nightmarket-00903b53-640.webp", "./assets/guide/f-nightmarket-00903b53-960.webp", "./assets/guide/s-redbrick-station-807d6ee0-640.webp", "./assets/guide/s-redbrick-station-807d6ee0-960.webp", "./assets/guide/f-icecream-cc0f38a5-640.webp", "./assets/guide/f-icecream-cc0f38a5-960.webp", "./assets/guide/f-suncake-f03fcb5c-640.webp", "./assets/guide/f-suncake-f03fcb5c-960.webp", "./assets/guide/f-damian-951bd8f8-640.webp", "./assets/guide/f-damian-951bd8f8-960.webp", "./assets/guide/f-caodaifan-1122fbdb-640.webp", "./assets/guide/f-caodaifan-1122fbdb-960.webp", "./assets/guide/f-bubbletea-996aed2d-640.webp", "./assets/guide/f-bubbletea-996aed2d-960.webp", "./assets/guide/s-dormitory-village-aeabc3c4-640.webp", "./assets/guide/s-dormitory-village-aeabc3c4-960.webp", "./assets/guide/f-goose-351a05f4-640.webp", "./assets/guide/f-goose-351a05f4-960.webp", "./assets/guide/s-mountain-lake-efd45581-640.webp", "./assets/guide/s-mountain-lake-efd45581-960.webp", "./assets/guide/f-danzai-a6e8dbd4-640.webp", "./assets/guide/f-danzai-a6e8dbd4-960.webp", "./assets/guide/s-red-pavilion-5f71f8d9-640.webp", "./assets/guide/s-red-pavilion-5f71f8d9-960.webp", "./assets/guide/s-confucian-bee02234-640.webp", "./assets/guide/s-confucian-bee02234-960.webp", "./assets/guide/s-white-museum-8dd6af8c-640.webp", "./assets/guide/s-white-museum-8dd6af8c-960.webp", "./assets/guide/s-1930s-store-ec35978e-640.webp", "./assets/guide/s-1930s-store-ec35978e-960.webp", "./assets/guide/f-beefsoup-06db1175-640.webp", "./assets/guide/f-beefsoup-06db1175-960.webp", "./assets/guide/s-lantern-street-8976b9d3-640.webp", "./assets/guide/s-lantern-street-8976b9d3-960.webp", "./assets/guide/f-milkfish-c18931fb-640.webp", "./assets/guide/f-milkfish-c18931fb-960.webp", "./assets/guide/f-tainan-snacks-49d8f0bd-640.webp", "./assets/guide/f-tainan-snacks-49d8f0bd-960.webp", "./assets/guide/f-baobing-06d7e599-640.webp", "./assets/guide/f-baobing-06d7e599-960.webp", "./assets/guide/s-banyan-warehouse-17da58b7-640.webp", "./assets/guide/s-banyan-warehouse-17da58b7-960.webp", "./assets/guide/s-old-fort-73358c82-640.webp", "./assets/guide/s-old-fort-73358c82-960.webp", "./assets/guide/f-douhua-652ce013-640.webp", "./assets/guide/f-douhua-652ce013-960.webp", "./assets/guide/s-sunset-harbor-07166efc-640.webp", "./assets/guide/s-sunset-harbor-07166efc-960.webp", "./assets/guide/f-night-local-ca9bcb26-640.webp", "./assets/guide/f-night-local-ca9bcb26-960.webp", "./assets/guide/f-shrimp-rice-703579b8-640.webp", "./assets/guide/f-shrimp-rice-703579b8-960.webp", "./assets/guide/f-xlb-8e5ce558-640.webp", "./assets/guide/f-xlb-8e5ce558-960.webp", "./assets/guide/f-duckrice-39275169-640.webp", "./assets/guide/f-duckrice-39275169-960.webp", "./assets/guide/s-warehouse-art-2e72ad5b-640.webp", "./assets/guide/s-warehouse-art-2e72ad5b-960.webp", "./assets/guide/s-pagoda-lake-752366f3-640.webp", "./assets/guide/s-pagoda-lake-752366f3-960.webp", "./assets/guide/f-night-kaohsiung-2eea36b0-640.webp", "./assets/guide/f-night-kaohsiung-2eea36b0-960.webp", "./assets/guide/s-stainedglass-70e94c2d-640.webp", "./assets/guide/s-stainedglass-70e94c2d-960.webp", "./assets/guide/f-baked-bun-53a8cef4-640.webp", "./assets/guide/f-baked-bun-53a8cef4-960.webp", "./assets/guide/s-wave-roof-ef420b3c-640.webp", "./assets/guide/s-wave-roof-ef420b3c-960.webp", "./assets/guide/s-ferry-8eeef978-640.webp", "./assets/guide/s-ferry-8eeef978-960.webp", "./assets/guide/f-seafood-street-50cd396d-640.webp", "./assets/guide/f-seafood-street-50cd396d-960.webp", "./assets/guide/s-consulate-hill-63a75e6e-640.webp", "./assets/guide/s-consulate-hill-63a75e6e-960.webp", "./assets/guide/f-shacha-hotpot-1c6772c6-640.webp", "./assets/guide/f-shacha-hotpot-1c6772c6-960.webp", "./assets/guide/f-milktea-942e0fad-640.webp", "./assets/guide/f-milktea-942e0fad-960.webp", "./assets/guide/f-burger-65627031-640.webp", "./assets/guide/f-burger-65627031-960.webp", "./assets/guide/s-pottery-street-4252245b-640.webp", "./assets/guide/s-pottery-street-4252245b-960.webp", "./assets/guide/s-arcade-street-41572020-640.webp", "./assets/guide/s-arcade-street-41572020-960.webp", "./assets/guide/f-izakaya-1914cec6-640.webp", "./assets/guide/f-izakaya-1914cec6-960.webp", "./assets/guide/f-steak-b23c612f-640.webp", "./assets/guide/f-steak-b23c612f-960.webp", "./assets/guide/s-shrine-cliff-cd6ef17b-640.webp", "./assets/guide/s-shrine-cliff-cd6ef17b-960.webp", "./assets/guide/f-rootbeer-dcb4838e-640.webp", "./assets/guide/f-rootbeer-dcb4838e-960.webp", "./assets/guide/s-airbase-view-513749c1-640.webp", "./assets/guide/s-airbase-view-513749c1-960.webp", "./assets/guide/f-tacos-0df25654-640.webp", "./assets/guide/f-tacos-0df25654-960.webp", "./assets/guide/s-seawall-jet-fdd171f2-640.webp", "./assets/guide/s-seawall-jet-fdd171f2-960.webp", "./assets/guide/s-us-houses-480a265f-640.webp", "./assets/guide/s-us-houses-480a265f-960.webp", "./assets/guide/th-breakfast-bb604d98-640.webp", "./assets/guide/th-breakfast-bb604d98-960.webp", "./assets/guide/th-nightmarket-howto-26660312-640.webp", "./assets/guide/th-nightmarket-howto-26660312-960.webp", "./assets/guide/t-transit-card-38aa60ec-640.webp", "./assets/guide/t-transit-card-38aa60ec-960.webp", "./assets/guide/t-metro-538cc92f-640.webp", "./assets/guide/t-metro-538cc92f-960.webp", "./assets/guide/t-airport-190a3743-640.webp", "./assets/guide/t-airport-190a3743-960.webp", "./assets/guide/g-howto-ab1a187c-640.webp", "./assets/guide/g-howto-ab1a187c-960.webp", "./assets/guide/f-starfruit-ice-fd21bcc0-640.webp", "./assets/guide/f-starfruit-ice-fd21bcc0-960.webp", "./assets/guide/f-jiangzhe-85f93f6e-640.webp", "./assets/guide/f-jiangzhe-85f93f6e-960.webp", "./assets/guide/s-wetland-windmills-ed36bd9e-640.webp", "./assets/guide/s-wetland-windmills-ed36bd9e-960.webp", "./assets/guide/s-curved-church-2173058f-640.webp", "./assets/guide/s-curved-church-2173058f-960.webp", "./assets/guide/f-crab-rice-43c78138-640.webp", "./assets/guide/f-crab-rice-43c78138-960.webp", "./assets/guide/f-fruit-ice-fc3fa4b5-640.webp", "./assets/guide/f-fruit-ice-fc3fa4b5-960.webp", "./assets/guide/s-mangrove-tunnel-55d96d76-640.webp", "./assets/guide/s-mangrove-tunnel-55d96d76-960.webp", "./assets/guide/f-tube-ricecake-31524dc8-640.webp", "./assets/guide/f-tube-ricecake-31524dc8-960.webp", "./assets/guide/s-big-buddha-1a7624f4-640.webp", "./assets/guide/s-big-buddha-1a7624f4-960.webp", "./assets/guide/s-ryukyu-gate-64a2a520-640.webp", "./assets/guide/s-ryukyu-gate-64a2a520-960.webp", "./assets/guide/s-stone-path-27ac0aee-640.webp", "./assets/guide/s-stone-path-27ac0aee-960.webp", "./assets/guide/f-sashimi-0bcb4c0f-640.webp", "./assets/guide/f-sashimi-0bcb4c0f-960.webp", "./assets/guide/s-chinese-garden-9a549bf7-640.webp", "./assets/guide/s-chinese-garden-9a549bf7-960.webp", "./assets/guide/s-fish-market-558ad660-640.webp", "./assets/guide/s-fish-market-558ad660-960.webp", "./assets/guide/s-bar-alley-590a68ac-640.webp", "./assets/guide/s-bar-alley-590a68ac-960.webp", "./assets/guide/s-castle-ruins-dc6a6cf9-640.webp", "./assets/guide/s-castle-ruins-dc6a6cf9-960.webp", "./assets/guide/s-ferris-wheel-f28504bc-640.webp", "./assets/guide/s-ferris-wheel-f28504bc-960.webp", "./assets/guide/s-sea-road-7fabf048-640.webp", "./assets/guide/s-sea-road-7fabf048-960.webp", "./assets/guide/f-okinawa-soba-ef91b151-640.webp", "./assets/guide/f-okinawa-soba-ef91b151-960.webp", "./assets/guide/t-money-55fa54a5-640.webp", "./assets/guide/t-money-55fa54a5-960.webp", "./assets/guide/t-clothes-3d82dc79-640.webp", "./assets/guide/t-clothes-3d82dc79-960.webp", "./assets/guide/t-help-5da6da4d-640.webp", "./assets/guide/t-help-5da6da4d-960.webp", "./assets/guide/t-metro-quiet-f5e2d486-640.webp", "./assets/guide/t-metro-quiet-f5e2d486-960.webp", "./assets/guide/t-luggage-37d6b87a-640.webp", "./assets/guide/t-luggage-37d6b87a-960.webp", "./assets/guide/t-chat-fc2cc6af-640.webp", "./assets/guide/t-chat-fc2cc6af-960.webp"];
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
