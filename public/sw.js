self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

async function checkNewOrders() {
  try {
    const res = await fetch('/api/store');
    const data = await res.json();
    if (data && Array.isArray(data.orders) && data.orders.length > 0) {
      const latest = data.orders[0];
      const cache = await caches.open('layane-last-order');
      const cachedRes = await cache.match('last-order-id');
      const lastId = cachedRes ? await cachedRes.text() : '';

      if (lastId && latest.id !== lastId) {
        await cache.put('last-order-id', new Response(latest.id));
        await self.registration.showNotification(`🚨 طلب جديد #${latest.id.slice(0, 8).toUpperCase()}!`, {
          body: `الزبون: ${latest.customer} (${latest.city}) • المجموع: ${latest.total} DH`,
          icon: '/icon.png',
          badge: '/icon.png',
          vibrate: [300, 100, 300, 100, 300],
          tag: 'order-' + latest.id,
          renotify: true,
          data: { url: '/admin' }
        });
      } else if (!lastId) {
        await cache.put('last-order-id', new Response(latest.id));
      }
    }
  } catch (e) {
    console.error('SW background check error:', e);
  }
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-new-orders') {
    event.waitUntil(checkNewOrders());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(checkNewOrders());
  }
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🚨 طلب جديد في المتجر!';
  const options = {
    body: data.body || 'وصلك طلب جديد، اضغط لمعاينة التفاصيل.',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: 'push-order',
    renotify: true,
    data: { url: '/admin' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/admin');
      }
    })
  );
});
