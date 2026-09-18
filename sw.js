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

const CACHE_VERSION = 'fodmap-v15';

/* ---------------------------------------------------------------------
 * THE OCR CACHE — a second cache, on purpose
 * ---------------------------------------------------------------------
 * Tesseract.js is about 5 MB all in: ~1.5 MB of engine (wasm, gzipped)
 * and ~3.7 MB of French and English language data. That is thirty times
 * the size of this entire app, so how it is cached is a real decision
 * rather than a detail.
 *
 * PRECACHING IT IS WRONG. Putting those URLs in ASSETS would mean every
 * first visit — including from someone who only ever pastes text, and
 * including the install that happens silently on page load — downloading
 * 5 MB before the service worker finishes installing. A failure on any
 * one of those requests fails cache.addAll() and the app has no offline
 * mode at all. The whole point of loading Tesseract lazily is undone if
 * the service worker eagerly fetches it anyway.
 *
 * CACHING IT ON FIRST USE IS RIGHT. Offline is not a nice-to-have here:
 * the app is used in supermarkets, which are famously concrete boxes
 * with no signal, and an OCR path that only works on wifi would be
 * useless exactly where it is needed. So the assets are cached the first
 * time the camera is actually used, and are available from then on.
 *
 * Kept in its own cache so that (a) shipping a new version of the app
 * does not throw away 5 MB the phone already downloaded, and (b) it can
 * be dropped independently with one line in the console:
 *
 *     caches.delete('fodmap-ocr-v1')
 *
 * Note that Tesseract.js separately keeps the language data in IndexedDB
 * itself. This cache is what makes the engine and worker scripts
 * available offline too; the two together are what make an offline scan
 * work.
 * ------------------------------------------------------------------- */
const OCR_CACHE = 'fodmap-ocr-v1';

/* Hosts the OCR path is allowed to fetch from, and the only cross-origin
 * requests this worker will cache. Kept in step with the pinned URLs at
 * the top of js/ocr.js. */
const OCR_HOSTS = ['cdn.jsdelivr.net', 'tessdata.projectnaptha.com'];

/* !! EVERY ASSET THE APP FETCHES AT RUNTIME MUST BE LISTED HERE !!
 *
 * An omission here does not 404 offline — it is worse than that. The fetch
 * handler below falls back to caches.match('./index.html'), so an uncached
 * stylesheet requested with no signal gets the HTML document as its
 * response, the browser refuses it on MIME grounds, and the page renders
 * completely unstyled. Online it is invisible, because the network answers
 * correctly. It fails only in the supermarket, which is the only place
 * this app is used. Adding a file to index.html means adding it here. */
const ASSETS = [
  './',
  './index.html',
  './css/tokens.css',
  './css/styles.css',
  './css/icons.css',
  './css/components.css',
  './js/app.js',
  './js/analyse.js',
  './js/capture.js',
  './js/foods.js',
  './js/gauge.js',
  './js/icons.js',
  './js/image-prep.js',
  './js/ingredients.js',
  './js/ocr.js',
  './js/render.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* css/icons.svg is deliberately absent: it is a design-tool copy of the
 * icon geometry, never fetched by the app, which inlines icons through
 * js/icons.js. */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* Old app caches are swept; OCR_CACHE is deliberately kept, because the
 * megabytes in it are still valid and re-downloading them on every app
 * update would be indefensible. */
const KEEP = [CACHE_VERSION, OCR_CACHE];

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !KEEP.includes(key)).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---------------------------------------------------------------------
 * Documents are network-first (so a markup change cannot get stuck
 * behind an old cache). Everything else is cache-first, with a
 * separate branch for the OCR assets.
 *
 * The OCR branch exists because the index.html fallback below is only
 * ever right for same-origin requests. Handing an HTML document to a
 * failed request for tesseract.min.js would turn a clean "text
 * recognition could not be downloaded" message into a syntax error, and
 * handing one to the wasm loader is worse still.
 * ------------------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (OCR_HOSTS.includes(url.hostname)) {
      event.respondWith(cacheOcrAsset(request));
    }
    /* Anything else cross-origin: left entirely alone, straight to the
     * network, no caching and no fallback. */
    return;
  }

  /* HTML is network-first so a new camera UI (or any other markup
   * change) cannot get stuck behind an old cache while the phone is
   * online. Everything else stays cache-first: CSS/JS are versioned
   * by CACHE_VERSION, and offline still falls back to the last good
   * index.html. */
  const isDocument =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html');

  if (isDocument) {
    event.respondWith(networkFirstDocument(request));
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => caches.match('./index.html'));
    })
  );
});

async function networkFirstDocument(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await caches.match(request, { ignoreSearch: true })) ||
      (await caches.match('./index.html'))
    );
  }
}

async function cacheOcrAsset(request) {
  const cached = await caches.match(request, { cacheName: OCR_CACHE });
  if (cached) return cached;

  const response = await fetch(request);

  /* Opaque responses (status 0) come from no-cors requests such as the
   * <script> tag that loads Tesseract. They are cached as well: opaque
   * or not, replaying one offline works, which is the whole objective.
   * A failed fetch throws, and is left to throw — js/ocr.js turns that
   * into a message the user can act on. */
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(OCR_CACHE);
    await cache.put(request, response.clone());
  }

  return response;
}
