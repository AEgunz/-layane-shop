self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

// Serialize push and foreground alerts so the same order only alerts once.
let notificationQueue = Promise.resolve();
function showNotification(data) {
  const task = notificationQueue.then(async () => {
    const tag = typeof data.tag === 'string' ? data.tag : 'layane-push';
    const cache = await caches.open('layane-notifications-v2');
    const key = new URL('/__notification/' + encodeURIComponent(tag), self.location.origin).href;
    const isOrder = tag.startsWith('order-');
    if (isOrder && await cache.match(key)) return;
    if (Number.isSafeInteger(data.badgeCount) && data.badgeCount >= 0) {
      try {
        if (data.badgeCount === 0 && self.navigator?.clearAppBadge) await self.navigator.clearAppBadge();
        else await self.navigator?.setAppBadge?.(data.badgeCount);
      } catch {
        // Badge support/permissions must not block the notification itself.
      }
    }
    await self.registration.showNotification(data.title || 'طلب جديد في المتجر', {
      body: data.body || 'وصلك طلب جديد. افتح التطبيق لمعاينة التفاصيل.',
      icon: '/icon.png', badge: '/icon.png', vibrate: [300, 100, 300],
      tag, data: {url: '/admin'},
    });
    if (isOrder) {
      await cache.put(key, new Response('shown'));
      const keys = await cache.keys();
      await Promise.all(keys.slice(0, Math.max(0, keys.length - 100)).map(key => cache.delete(key)));
    }
  });
  notificationQueue = task.catch(() => {});
  return task;
}

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch {}
  event.waitUntil(showNotification(data));
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'ORDER_NOTIFICATION' || typeof event.data.id !== 'string') return;
  event.waitUntil(showNotification({
    title: 'طلب جديد في متجر layane-shop',
    body: 'وصلك طلب جديد #' + event.data.id.slice(0, 8).toUpperCase() + '. افتح التطبيق لمعاينة التفاصيل.',
    tag: 'order-' + event.data.id,
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = (event.notification.data && event.notification.data.url) || '/admin';
    const targetUrl = new URL(target, self.location.origin).href;
    const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    // Reuse an existing app window: navigate it to the admin and focus it.
    // This avoids Android spawning a separate browser tab outside the installed app.
    for (const client of windows) {
      try {
        if (new URL(client.url).origin !== self.location.origin) continue;
      } catch { continue; }
      try {
        if (client.url.split('#')[0] !== targetUrl && typeof client.navigate === 'function') {
          await client.navigate(targetUrl);
        }
      } catch {}
      return client.focus();
    }
    const opened = await self.clients.openWindow(target);
    if (opened) return opened;
    // openWindow was blocked: fall back to focusing any window we already have.
    for (const client of windows) {
      try { return await client.focus(); } catch {}
    }
  })());
});
