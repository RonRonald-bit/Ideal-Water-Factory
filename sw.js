/* Ideal-Water SW — HTML doim tarmoqdan (yangi kod), offline da cache */
const CACHE = 'ideal-water-v4';
const ASSETS = [
  './',
  './index.html',
  './logo-ideal-water.jpg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isHTML =
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/ideal-factory') ||
    url.pathname.endsWith('/ideal-factory/');

  // index.html va sahifa — AVVAL tarmoq (yangilanish darhol)
  if (isHTML) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // sw.js o'zi — doim tarmoq
  if (url.pathname.endsWith('sw.js')) {
    e.respondWith(fetch(req));
    return;
  }

  // qolgan fayllar — cache, keyin tarmoq
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
