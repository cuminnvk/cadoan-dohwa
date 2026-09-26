const CACHE_NAME = 'cadoan-dohwa-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/components.css',
  './js/store.js',
  './js/liturgical-helper.js',
  './js/player.js',
  './js/pdf-viewer.js',
  './js/soan-le.js',
  './js/thong-ke.js',
  './js/app.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Bỏ qua external API / YouTube
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // CHIẾN LƯỢC NETWORK-FIRST: Luôn lấy code mới nhất từ server trước
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(() => {
        // Chỉ khi mất mạng mới dùng cache offline
        return caches.match(event.request).then(cached => cached || caches.match('./index.html'));
      })
  );
});
