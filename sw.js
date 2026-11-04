const CACHE = "guide-cce43f619b";
const PRECACHE = ["days/2026-11-17/", "days/2026-11-18/", "days/2026-11-19/", "days/2026-11-20/", "days/2026-11-21/"];
const SKIP = /\.(mp3|zip)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("guide-") && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || SKIP.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Pages: bypass the browser's 10-minute HTTP cache so an update shows on the next visit.
      const response = await (request.mode === "navigate"
        ? fetch(request.url, { cache: "no-cache", credentials: "same-origin" })
        : fetch(request));
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      throw error;
    }
  })());
});
