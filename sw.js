/* モンゴル旅行ガイド 専用Service Worker。
   このサイト（mongolia-guide-202609-*キャッシュ）以外のキャッシュには一切触れない。
   地図タイル・OSRM・Open-Meteo・Googleフォント・CDN等の外部リソースはキャッシュ対象外（ネットワークにそのまま委ねる）。
*/
const BUILD_ID = "2026-09-18";
const CACHE_NAME = `mongolia-guide-202609-${BUILD_ID}`;
const CORE_ASSETS = ["./", "./index.html"];
const IMAGE_ASSETS = ["./assets/guide/g01-steppe-18752df5-640.webp", "./assets/guide/g01-steppe-18752df5-960.webp", "./assets/guide/g02-city-street-92575049-640.webp", "./assets/guide/g02-city-street-92575049-960.webp", "./assets/guide/g03-turtle-rock-ff9ed908-640.webp", "./assets/guide/g03-turtle-rock-ff9ed908-960.webp", "./assets/guide/g04-ger-exterior-328a4d60-640.webp", "./assets/guide/g04-ger-exterior-328a4d60-960.webp", "./assets/guide/g05-ger-interior-4983fb84-640.webp", "./assets/guide/g05-ger-interior-4983fb84-960.webp", "./assets/guide/g06-textile-547ad7f4-640.webp", "./assets/guide/g06-textile-547ad7f4-960.webp", "./assets/guide/g07-horses-7e117e93-640.webp", "./assets/guide/g07-horses-7e117e93-960.webp", "./assets/guide/g08-buuz-65909226-640.webp", "./assets/guide/g08-buuz-65909226-960.webp", "./assets/guide/g09-khuushuur-4d755791-640.webp", "./assets/guide/g09-khuushuur-4d755791-960.webp", "./assets/guide/g10-tsuivan-8f54bafe-640.webp", "./assets/guide/g10-tsuivan-8f54bafe-960.webp", "./assets/guide/g11-camel-c4d5a0fb-640.webp", "./assets/guide/g11-camel-c4d5a0fb-960.webp", "./assets/guide/g12-night-steppe-646b6f19-640.webp", "./assets/guide/g12-night-steppe-646b6f19-960.webp", "./assets/guide/g13-khorkhog-3e386386-640.webp", "./assets/guide/g13-khorkhog-3e386386-960.webp", "./assets/guide/g14-noodle-soup-70559748-640.webp", "./assets/guide/g14-noodle-soup-70559748-960.webp", "./assets/guide/g15-dairy-spread-a10b836e-640.webp", "./assets/guide/g15-dairy-spread-a10b836e-960.webp", "./assets/guide/g16-suutei-tsai-7705cae4-640.webp", "./assets/guide/g16-suutei-tsai-7705cae4-960.webp", "./assets/guide/g17-airag-afaba4f1-640.webp", "./assets/guide/g17-airag-afaba4f1-960.webp", "./assets/guide/g18-diner-c8823ce8-640.webp", "./assets/guide/g18-diner-c8823ce8-960.webp", "./assets/guide/g19-cashmere-knit-d2f9da29-640.webp", "./assets/guide/g19-cashmere-knit-d2f9da29-960.webp", "./assets/guide/g20-felt-goods-c0cc244b-640.webp", "./assets/guide/g20-felt-goods-c0cc244b-960.webp", "./assets/guide/g21-craft-wood-160058d5-640.webp", "./assets/guide/g21-craft-wood-160058d5-960.webp", "./assets/guide/g22-honey-jars-f745350e-640.webp", "./assets/guide/g22-honey-jars-f745350e-960.webp", "./assets/guide/g23-market-textiles-bad3f1d7-640.webp", "./assets/guide/g23-market-textiles-bad3f1d7-960.webp", "./assets/guide/g26-dirt-road-e24bb680-640.webp", "./assets/guide/g26-dirt-road-e24bb680-960.webp", "./assets/guide/g27-morning-frost-e9ccae09-640.webp", "./assets/guide/g27-morning-frost-e9ccae09-960.webp", "./assets/guide/g28-packing-flatlay-d50bdee5-640.webp", "./assets/guide/g28-packing-flatlay-d50bdee5-960.webp", "./assets/guide/g24-museum-light-3892fc1f-640.webp", "./assets/guide/g24-museum-light-3892fc1f-960.webp"];
const ALL_ASSETS = CORE_ASSETS.concat(IMAGE_ASSETS);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith("mongolia-guide-202609-") && k !== CACHE_NAME)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

function isSameOrigin(url) {
  try {
    return new URL(url, self.location.href).origin === self.location.origin;
  } catch (e) {
    return false;
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (!isSameOrigin(req.url)) return; // 外部リソースはオフライン保証の対象外。素通しする。

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      return res;
    } catch (e) {
      if (req.mode === "navigate") {
        const fallback = (await cache.match("./index.html")) || (await cache.match("./"));
        if (fallback) return fallback;
      }
      throw e;
    }
  })());
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "SAVE_FOR_TRIP") return;
  const port = event.ports && event.ports[0];
  event.waitUntil((async () => {
    let saved = 0;
    let failed = 0;
    try {
      const cache = await caches.open(CACHE_NAME);
      for (const url of ALL_ASSETS) {
        try {
          const res = await fetch(url, { cache: "reload" });
          if (res && res.ok) {
            await cache.put(url, res.clone());
            saved++;
          } else {
            failed++;
          }
        } catch (e) {
          failed++;
        }
      }
      if (port) port.postMessage({ ok: failed === 0, imagesSaved: saved, missingCount: failed });
    } catch (e) {
      if (port) port.postMessage({ ok: false, reason: String(e) });
    }
  })());
});
