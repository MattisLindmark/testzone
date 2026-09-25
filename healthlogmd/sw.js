// Service Worker för HealthLogMD
// Uppdatera CACHE_NAME när du gör nya releases (v1 -> v2 -> v3 osv)
// Service Workern checkar automatiskt vid sidladdning

const CACHE_NAME = 'healthlog-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/ui.js',
  './js/fileService.js',
  './js/indexedDBService.js',
  './js/markdownParser.js',
  './js/dateUtils.js',
  './manifest.json'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'basic' && !response.url.startsWith(self.location.origin)) {
              return response;
            }

            // Clone response and add to cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Return offline page or default response
        return new Response('Offline - vänligen anslut till internet', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});
