// NewsBrick service worker (web version only).
// 1. Offline: keeps a copy of the app so it opens without a connection. (Today's stories
//    are already saved on the phone by the app itself.)
// 2. Morning notification: shows "Your stories are ready" when the NewsBrick service sends
//    a push, and opens the app when tapped.

const CACHE = 'newsbrick-app-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // App code and fonts have unique file names per version: the saved copy is always right.
  if (url.pathname.includes('/_expo/static/') || url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Everything else (the page itself, icons, manifest): use the network so updates show up
  // right away, and fall back to the saved copy when offline.
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match(self.registration.scope))),
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // The service sends no payload; use the default message.
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Your NewsBrick is ready', {
      body: data.body || 'Today’s top stories are waiting. About 60 seconds.',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: 'newsbrick-daily', // replaces yesterday's notification instead of stacking
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.registration.scope));
      return open ? open.focus() : self.clients.openWindow(self.registration.scope);
    }),
  );
});
