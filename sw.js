// Service Worker — caches HTML shell, serves offline
const CACHE = "job-dashboard-v1";
const SHELL = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // API calls — network only (no offline cache for live data)
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify({ error: "Offline — no cached data" }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      })
    ));
    return;
  }

  // Shell — cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && SHELL.includes(url.pathname)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
