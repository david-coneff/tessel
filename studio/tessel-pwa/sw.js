/*
 * sw.js — Tessel VS PWA service worker (source; esbuild bundles + minifies it
 * into dist/sw.js via studio/build-pwa.mjs).
 *
 * This is the hand-rolled equivalent of what vite-plugin-pwa generated through
 * Workbox. Because the esbuild single-file build inlines the entire app into one
 * index.html, the precache set is tiny and explicit — there is no multi-asset
 * revision table to generate, just one content hash (__SW_VERSION__, injected at
 * build time) that busts the cache whenever the app changes.
 *
 * Behaviour mirrors the old config: registerType 'autoUpdate' (skipWaiting +
 * clients.claim so a new build takes over immediately) and offline-first serving.
 */
const VERSION = __SW_VERSION__;
const CACHE = 'tessel-vs-' + VERSION;
// Relative to the SW scope (served at /tessel/). './' and 'index.html' are the
// same app shell; caching it makes the whole inlined app available offline.
const PRECACHE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Drop caches from prior builds (any name that isn't the current version).
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith((async () => {
    // Cache-first: the app is fully inlined, so a cache hit serves it offline.
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const res = await fetch(req);
      // Runtime-cache successful same-origin GETs (e.g. the navigation request).
      if (res && res.ok && new URL(req.url).origin === self.location.origin) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      // Offline and uncached: fall back to the app shell for navigations.
      if (req.mode === 'navigate') {
        const shell = (await caches.match('index.html')) || (await caches.match('./'));
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
