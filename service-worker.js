const CACHE_VERSION = "v1.1.22";
const CACHE_PREFIX = "eduwebquest-cache";
const CACHE_NAME = `${CACHE_PREFIX}-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./html/index.html",
  "./html/examples.json",
  "./manifest.webmanifest",
  "./assets/css/app.css",
  "./assets/css/preview.css",
  "./assets/js/main.js",
  "./assets/js/preview.js",
  "./assets/preview-template.html",
  "./assets/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.warn("[ServiceWorker] Error precaching assets:", error);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function cacheOrFetch(request) {
  return caches.match(request).then((cached) => {
    if (cached) {
      return cached;
    }
    return fetch(request)
      .then((response) => {
        if (
          !response ||
          response.status !== 200 ||
          response.type === "opaque"
        ) {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        return response;
      })
      .catch(() => {
        if (request.mode === "navigate") {
          return caches.match("./");
        }
        return caches.match(request);
      });
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(cacheOrFetch(request));
});
