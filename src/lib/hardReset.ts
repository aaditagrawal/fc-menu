"use client";

/**
 * One-tap equivalent of "clear site data" in the browser's settings.
 *
 * When someone lands on an error state, the usual cause is state that survived
 * across visits — a persisted query cache, a sticky filter, a service-worker
 * cache — and a plain reload replays exactly that state. Wiping it first is the
 * only reload that reliably gets them unstuck.
 */

// next-themes' default storage key. Everything else is disposable, but wiping
// this would flash a dark-mode user to light on the reload — a worse experience
// than the error we're recovering from.
const PRESERVED_LOCAL_STORAGE_KEYS = ["theme"];

/** One-shot marker so the reload can't be answered from the HTTP cache. */
export const RESET_PARAM = "fresh";

function expireCookies() {
  const { pathname } = window.location;

  // Expiry writes are host-only (no domain attribute) on purpose: this origin
  // can share a parent domain with sibling apps, and a domain= write would
  // reach over and expire their cookies too. Every cookie this app sets is
  // host-only. A deletion still has to match the original path exactly, and
  // JS can't read paths back, so sweep the root path plus each prefix of the
  // current path.
  const paths = ["/"];
  let prefix = "";
  for (const segment of pathname.split("/").filter(Boolean)) {
    prefix += `/${segment}`;
    paths.push(prefix);
  }

  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (!name) continue;

    for (const path of paths) {
      document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }
}

function clearWebStorage() {
  try {
    const preserved = new Map<string, string>();
    for (const key of PRESERVED_LOCAL_STORAGE_KEYS) {
      const value = window.localStorage.getItem(key);
      if (value !== null) preserved.set(key, value);
    }

    window.localStorage.clear();

    for (const [key, value] of preserved) {
      window.localStorage.setItem(key, value);
    }
  } catch {}

  try {
    window.sessionStorage.clear();
  } catch {}
}

async function clearCacheStorage() {
  if (!("caches" in window)) return;

  try {
    const names = await window.caches.keys();
    await Promise.all(names.map((name) => window.caches.delete(name)));
  } catch {}
}

async function unregisterServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  } catch {}
}

async function clearIndexedDb() {
  // Feature detection by presence: `indexedDB` is absent outside a browser, and
  // `databases()` is absent on engines that never shipped it (Firefox < 126).
  if (!("indexedDB" in globalThis) || !("databases" in indexedDB)) return;

  try {
    const databases = await indexedDB.databases();
    await Promise.all(
      databases.map(
        (database) =>
          new Promise<void>((resolve) => {
            if (!database.name) return resolve();
            const request = indexedDB.deleteDatabase(database.name);
            // A delete blocked by another open tab never fires onsuccess; don't
            // hang the reset on it.
            request.onsuccess = request.onerror = request.onblocked = () => resolve();
          }),
      ),
    );
  } catch {}
}

/** Wipe every client-side store this origin can reach. Never throws. */
export async function hardResetSiteData() {
  if (!("window" in globalThis)) return;

  expireCookies();
  clearWebStorage();
  await Promise.all([clearCacheStorage(), unregisterServiceWorkers(), clearIndexedDb()]);
}

/** Wipe client-side state, then reload onto a guaranteed-fresh document. */
export async function hardResetAndReload() {
  if (!("window" in globalThis)) return;

  // Offline, the service worker and CacheStorage hold the only copy of the app
  // the browser can still serve — wiping them and navigating would brick the
  // PWA until the network returns. Refuse; callers fall back to a plain
  // reload, which the cached app still answers.
  if (!navigator.onLine) {
    throw new Error("Refusing to reset app data while offline");
  }

  await hardResetSiteData();

  // The cache-busting param guarantees the navigation isn't answered from the
  // HTTP cache; AppChrome strips it once the fresh page is up. replace() keeps
  // the broken page out of history so Back doesn't land on it again.
  const url = new URL(window.location.href);
  url.searchParams.set(RESET_PARAM, Date.now().toString(36));
  window.location.replace(url.toString());
}
