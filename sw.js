// Service Worker untuk Rekamkeu (Rekkeu_25)
// Strategi: cache-first untuk app shell, dengan update di background (stale-while-revalidate)
// supaya versi baru otomatis terpakai di kunjungan berikutnya tanpa mengorbankan akses offline.

const CACHE_VERSION = 'rekamkeu-v1';
const APP_SHELL = [
  './Rekkeu_25.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Hanya tangani request GET ke origin sendiri; selain itu biarkan browser yang urus.
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Untuk navigasi (buka app / reload), utamakan cache supaya tetap bisa dibuka saat offline,
  // lalu perbarui cache di belakang layar kalau ada koneksi.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // Offline dan tidak ada di cache: gagal dengan tenang.

      return cached || networkFetch;
    })
  );
});
