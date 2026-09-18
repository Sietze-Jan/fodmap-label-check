/* =====================================================================
 * sw.js — SERVICE WORKER (offline support)
 * =====================================================================
 *
 * Caches the whole app so it works in a supermarket with no signal. The
 * app never makes network requests of its own, so once cached it is fully
 * self-contained.
 *
 * !! IMPORTANT WHEN YOU EDIT THE APP !!
 * Bump CACHE_VERSION below. Otherwise phones keep serving the old cached
 * copy and your ingredient edits will not show up. This is the single
 * most common "why isn't my change live?" cause.
 *
 * All paths are relative, because GitHub Pages serves the site from a
 * /repo-name/ subdirectory rather than the domain root.
 * ===================================================================== */

const CACHE_VERSION = 'fodmap-v1';

const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/analyse.js',
  './js/ingredients.js',
  './js/render.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* Cache-first: instant loads, and works offline. Falls back to the network
 * for anything not pre-cached. */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
