/* 片付け用Service Worker。前回の旅行（モンゴル）で端末に登録されたService Workerは
   保存済みのページを優先して表示するため、同じURLに新しい旅行を公開しても古いページが出続ける。
   ブラウザの定期更新でこのファイルに置き換わると、前回のキャッシュだけを削除して登録を解除し、
   開いている画面を再読み込みする。ガイドブック機能を追加する際は build_site.py が生成する sw.js で上書きされる。 */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("mongolia-guide-")).map((k) => caches.delete(k)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach((c) => c.navigate(c.url));
  })());
});
