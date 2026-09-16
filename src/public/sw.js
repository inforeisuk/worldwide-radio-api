const CACHE_NAME = 'radiotop-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar streaming de áudio, proxies e chamadas dinâmicas de API
  if (
    url.pathname.includes('/proxy') ||
    url.pathname.includes('/stream') ||
    url.pathname.endsWith('.m3u') ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.aac') ||
    url.pathname.endsWith('.mp3')
  ) {
    return;
  }

  // Se for recurso estático, tentar network com fallback de cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, atualizar a cache para ficheiros estáticos locais
        if (response && response.status === 200 && url.origin === self.location.origin && !url.pathname.startsWith('/api/')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
