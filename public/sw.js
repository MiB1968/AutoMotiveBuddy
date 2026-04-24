const CACHE_NAME = "auto-buddy-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Basic assets to cache
      return cache.addAll([
        "/",
        "/index.html"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  // We don't want to intercept API network requests with simple match cache.
  // Instead, pass through API calls, and cache static assets if they fail
  if (event.request.url.includes('/api/')) {
    return; // allow api calls to just fail or succeed naturally to hit offline fallbacks in code
  }
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
