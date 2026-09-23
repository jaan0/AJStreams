// Only public assets are cached. Sessions, account data, API responses,
// and Next.js server-component payloads always stay on the network.
const STATIC_CACHE = 'ajstreams-static-v2';
const OFFLINE_URL = '/offline.html';
const APP_SHELL = [OFFLINE_URL, '/manifest.json', '/logo.png', '/icons/icon-192x192.png', '/icons/icon-512x512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('ajstreams-') && name !== STATIC_CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || request.headers.get('RSC') === '1') return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch {
        const cached = await caches.match(OFFLINE_URL);
        return cached || new Response('You are offline. Reconnect to use AJStreams.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  const isPublicAsset = url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || APP_SHELL.includes(url.pathname);
  if (!isPublicAsset) return;
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) {
        try { await cache.put(request, response.clone()); } catch { /* Full storage must not block loading. */ }
      }
      return response;
    } catch { return Response.error(); }
  })());
});

self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(self.registration.showNotification(data.title || 'AJStreams', {
    body: data.body || 'New content available!', icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png', data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin);
  event.waitUntil(self.clients.openWindow(target.origin === self.location.origin ? target.href : '/'));
});
