// Lucas Warrior HQ — Service Worker
// Caches everything on first load. Works 100% offline after that.

const CACHE = 'lucas-hq-v1';

const PAGES = [
  '/index.html',
  '/warrior-training.html',
  '/lucas-mission.html',
  '/WARRIOR-PLAYLIST.html',
  '/LUCAS-WARRIOR-PROGRAM.html',
  '/lucas-holiday-program.html',
  '/LUCAS-WARRIOR-CODE.html',
  '/officer-rex.html',
  '/lightsaber-training.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: cache all pages immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(PAGES);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache first, fall back to network and cache the result
self.addEventListener('fetch', event => {
  // Cache Google Fonts too
  const url = event.request.url;
  const isFont = url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then(response => {
        // Only cache valid responses
        if (!response || response.status !== 200) return response;
        // Cache fonts and same-origin requests
        if (isFont || event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline and not cached — return offline fallback for HTML
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
