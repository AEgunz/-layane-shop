export async function pushRegistration() {
  if (!window.isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('الإشعارات تحتاج HTTPS ومتصفح يدعمها. افتح التطبيق في Chrome أو Edge.');
  }
  await navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'});
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('تعذر تشغيل الإشعارات. أعد فتح التطبيق وحاول مجدداً.')), 15000)),
  ]);
}

async function request(path: string, init?: RequestInit) {
  const response = await fetch(path, {credentials: 'same-origin', ...init});
  const body = await response.json() as {error?: string; publicKey?: string};
  if (!response.ok) throw new Error(body.error || 'تعذر تفعيل الإشعارات.');
  return body;
}

export async function enablePush(test = false) {
  const registration = await pushRegistration();
  const {publicKey} = await request('/api/push');
  if (!publicKey) throw new Error('مفتاح الإشعارات غير موجود على السيرفر.');
  const decoded = atob(publicKey.replace(/-/g, '+').replace(/_/g, '/'));
  const applicationServerKey = Uint8Array.from(decoded, c => c.charCodeAt(0));
  let subscription = await registration.pushManager.getSubscription();
  if (subscription?.options.applicationServerKey &&
      String(new Uint8Array(subscription.options.applicationServerKey)) !== String(applicationServerKey)) {
    await subscription.unsubscribe();
    subscription = null;
  }
  subscription ??= await registration.pushManager.subscribe({userVisibleOnly: true, applicationServerKey});
  await request('/api/push', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({subscription: subscription.toJSON(), test}),
  });
}

export async function disablePush() {
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  await request('/api/push', {
    method: 'DELETE', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({endpoint: subscription.endpoint}),
  });
  await subscription.unsubscribe();
}

export async function showOrderNotification(id: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const registration = await pushRegistration();
  registration.active?.postMessage({type: 'ORDER_NOTIFICATION', id});
}
