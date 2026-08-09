const CACHE_NAME = "fc-menu-v4";
const STATIC_ASSETS = ["/", "/favicon.svg", "/icon-192.png", "/icon-512.png"];

const MENU_DATA_PREFIX = "/data/menu-bundle/";
const MENU_MANIFEST_PATH = "/data/menu-bundle/manifest.json";

// The only cross-origin host whose responses may be cached (the menu API).
// Notably the analytics host is excluded so beacons never linger in the cache.
const CACHEABLE_CROSS_ORIGIN_HOSTS = ["tikm.coolstuff.work"];

// FIFO bound so the cache can't grow without limit (week files, API
// responses, and icons all share the one cache).
const MAX_CACHE_ENTRIES = 150;

function isCacheableAsset(request, url) {
  if (request.method !== "GET") return false;

  if (url.origin !== self.location.origin) {
    return CACHEABLE_CROSS_ORIGIN_HOSTS.includes(url.hostname);
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// cache.keys() resolves in insertion order, so the overflow is trimmed from
// the front (oldest first).
async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_CACHE_ENTRIES) return;
  await Promise.all(keys.slice(0, keys.length - MAX_CACHE_ENTRIES).map((key) => cache.delete(key)));
}

async function putInCache(request, response, event) {
  const clone = response.clone();
  // Quota errors and terminated requests must not surface as unhandled
  // rejections in the fetch handler.
  const write = (async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, clone);
      await trimCache(cache);
    } catch {
      // ignore
    }
  })();
  if (event) {
    event.waitUntil(write);
  }
  await write;
}

function networkFirst(request, fallbackPath, event) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        putInCache(request, response, event);
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

function cacheFirst(request, event) {
  return caches.match(request).then(
    (cached) =>
      cached ||
      fetch(request).then((response) => {
        if (response.ok) {
          putInCache(request, response, event);
        }
        return response;
      })
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Normalize away credentials so a `user:pass@host` variant can't sidestep
  // the navigation/menu-data branches below (URL equality includes them).
  const url = new URL(request.url);
  url.username = "";
  url.password = "";
  const isPlainUrl = url.href === request.url;

  // Always prefer network for navigations so reloads get the latest HTML,
  // but keep a cached copy so the app still opens offline. Query-string
  // navigations are served but not cached — each unique query would
  // otherwise occupy its own cache entry.
  if (request.mode === "navigate") {
    event.respondWith(
      !isPlainUrl || url.search
        ? fetch(request).catch(() =>
            caches.match("/").then((cached) => cached || Response.error())
          )
        : networkFirst(request, "/", event)
    );
    return;
  }

  if (isPlainUrl && url.origin === self.location.origin && url.pathname.startsWith(MENU_DATA_PREFIX)) {
    // The manifest is the freshness gate for menu data: network-first, cached
    // only as an offline fallback.
    if (url.pathname === MENU_MANIFEST_PATH) {
      event.respondWith(networkFirst(request, undefined, event));
      return;
    }

    // Week files are content-hashed and immutable: cache-first.
    event.respondWith(cacheFirst(request, event));
    return;
  }

  if (!isPlainUrl) {
    // Credentialed URL variants fall through to the network untouched.
    return;
  }

  // Network-first for the allowlisted cross-origin API (live data fallback);
  // other origins (e.g. analytics) go straight to the network uncached.
  if (url.origin !== self.location.origin) {
    if (isCacheableAsset(request, url)) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              putInCache(request, response, event);
            }
            return response;
          })
          .catch(() => caches.match(request))
      );
    }
    return;
  }

  if (!isCacheableAsset(request, url)) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    // Content-hashed build artifacts are immutable: serve from cache and only
    // hit the network on a miss.
    event.respondWith(cacheFirst(request, event));
    return;
  }

  // Other static assets: cache-first, refreshing the copy in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request);
      // Registered while the respondWith promise is still pending: keeps the
      // worker alive for the background write even when the cache wins and
      // the response settles early (a late waitUntil would throw).
      event.waitUntil(
        network
          .then((response) => {
            if (response.ok) return putInCache(request, response);
          })
          .catch(() => {})
      );
      return cached || network;
    })
  );
});
