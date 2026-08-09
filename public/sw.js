const CACHE_NAME = "fc-menu-v3";
const STATIC_ASSETS = ["/", "/favicon.svg", "/icon-192.png", "/icon-512.png"];

const MENU_DATA_PREFIX = "/data/menu-bundle/";
const MENU_MANIFEST_PATH = "/data/menu-bundle/manifest.json";

function isCacheableAsset(request, url) {
  if (request.method !== "GET") return false;

  if (url.origin !== self.location.origin) {
    return true;
  }

  if (request.mode === "navigate") {
    return false;
  }

  return (
    url.pathname.startsWith("/_next/static/") ||
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font" ||
    STATIC_ASSETS.includes(url.pathname)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

async function putInCache(request, response) {
  const clone = response.clone();
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, clone);
}

function networkFirst(request, fallbackPath) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        putInCache(request, response);
      }
      return response;
    })
    .catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (fallbackPath) {
        const fallback = await caches.match(fallbackPath);
        if (fallback) return fallback;
      }
      return Response.error();
    });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Always prefer network for navigations so reloads get the latest HTML,
  // but keep a cached copy so the app still opens offline.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "/"));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith(MENU_DATA_PREFIX)) {
    // The manifest is the freshness gate for menu data: network-first, cached
    // only as an offline fallback.
    if (url.pathname === MENU_MANIFEST_PATH) {
      event.respondWith(networkFirst(request));
      return;
    }

    // Week files are content-hashed and immutable: cache-first.
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              putInCache(request, response);
            }
            return response;
          }),
      ),
    );
    return;
  }

  // Network-first for other cross-origin requests (live API fallback)
  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && isCacheableAsset(request, url)) {
            putInCache(request, response);
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  if (!isCacheableAsset(request, url)) {
    return;
  }

  // Cache-first for immutable/static assets only
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          putInCache(request, response);
        }
        return response;
      });
      return cached || fetchPromise;
    }),
  );
});
