const CACHE_NAME = 'naatal-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API requests — let them go directly to the network
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // For navigation requests (HTML pages), always go to network first
  // This ensures the SPA router handles all routes including /admin
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other requests, network first with cache fallback
  event.respondWith(
    fetch(event.request).then((response) => {
      // Cache static assets
      if (response.ok && (url.pathname.match(/\.(js|css|png|jpg|svg|woff2?)$/))) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
      }
      return response;
    }).catch(() =>
      caches.match(event.request).then((cached) =>
        cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
      )
    )
  );
});
