const CACHE_STATIC = 'fdm-static-v1';
const CACHE_CONTENT = 'fdm-content-v1';

const PRECACHE = [
  '/',
  '/index.html',
  '/app.html',
  '/manifest.json',
  '/assets/css/tokens.css',
  '/assets/css/base.css',
  '/assets/css/components.css',
  '/assets/css/app.css',
  '/assets/js/main.js',
  '/assets/js/app.js',
  '/assets/js/content.js',
  '/assets/logo.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/content/index.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_STATIC && k !== CACHE_CONTENT)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/content/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_CONTENT).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  }
});
