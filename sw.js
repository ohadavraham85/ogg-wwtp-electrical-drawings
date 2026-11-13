// OhadCad service worker: keeps the app on the device so it opens offline.
// Pages are network-first (an update you push shows up on the next open);
// everything else is served from the cache and refreshed in the background.
const CACHE = 'ohadcad-v47';
const CORE = [
  './', './index.html', './cad.html', './manifest.webmanifest',
  './vendor/firebase/firebase-app-compat.js',
  './vendor/firebase/firebase-auth-compat.js',
  './vendor/firebase/firebase-firestore-compat.js',
  './icons/icon.svg', './icons/ohadcad-192.png', './icons/ohadcad-512.png',
  './icons/ohadcad-maskable-192.png', './icons/ohadcad-maskable-512.png',
  './icons/ohadcad-apple-180.png', './icons/ohadcad-32.png', './icons/ohadcad-16.png', './icons/ohadcad.ico', './favicon.ico',
  './icons/wordmark-dark.svg', './icons/wordmark-light.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Also clears the old "panels-page-v1" cache of the app that used to live here.
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html');
  if (isPage) {
    event.respondWith(
      // Always asks the server whether the page changed, past the browser's own cache.
      fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      });
      return hit || net;
    })
  );
});
