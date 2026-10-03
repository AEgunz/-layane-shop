import webpush, {type PushSubscription} from 'web-push';
import {createHash} from 'node:crypto';
import {putPushSetting, deletePushSetting, listPushSubscriptions, orderWasSaved} from './push-storage';

const prefix = 'push-subscription:';

export function pushConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error('إشعارات الخلفية غير مهيأة على السيرفر. خاص إعداد VAPID_PUBLIC_KEY و VAPID_PRIVATE_KEY و VAPID_SUBJECT.');
  }
  return {publicKey, privateKey, subject};
}

// Only accept browser push services; never fetch arbitrary subscription URLs.
export function validPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (
      url.hostname === 'fcm.googleapis.com' ||
      url.hostname === 'updates.push.services.mozilla.com' ||
      url.hostname === 'web.push.apple.com' ||
      url.hostname.endsWith('.notify.windows.com')
    );
  } catch { return false; }
}

export function subscriptionKey(endpoint: string) {
  return prefix + createHash('sha256').update(endpoint).digest('hex');
}

export async function saveSubscription(subscription: PushSubscription) {
  await putPushSetting(subscriptionKey(subscription.endpoint), JSON.stringify(subscription));
}

export async function removeSubscription(endpoint: string) {
  await deletePushSetting(subscriptionKey(endpoint));
}

export async function sendPush(subscription: PushSubscription, payload: {title: string; body: string; tag: string}) {
  if (!validPushEndpoint(subscription.endpoint)) throw new Error('Invalid push service');
  // Generate standard encrypted Web Push, then use fetch for Node and Workers.
  const request = webpush.generateRequestDetails(subscription, JSON.stringify(payload), {
    vapidDetails: pushConfig(), TTL: 3600, urgency: 'high',
  });
  const response = await fetch(request.endpoint, {
    method: 'POST', headers: request.headers as Record<string, string>,
    body: new Uint8Array(request.body!), redirect: 'error',
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404 || response.status === 410) {
    await removeSubscription(subscription.endpoint);
  }
  if (!response.ok) throw new Error(`Push service rejected notification (${response.status})`);
}

export async function notifyNewOrder(id: string) {
  // Notifications must never turn an already saved order into a checkout error.
  try {
    if (!await orderWasSaved(id)) return;
    const rows = await listPushSubscriptions();
    if (!rows.length) return;
    await Promise.all(rows.map(async (row: {value: string}) => {
      try {
        await sendPush(JSON.parse(row.value), {
          title: 'طلب جديد في متجر layane-shop',
          body: `وصلك طلب جديد #${id.slice(0, 8).toUpperCase()}. افتح التطبيق لمعاينة التفاصيل.`,
          tag: `order-${id}`,
        });
      } catch (error) {
        console.error('Order push failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }));
  } catch (error) {
    console.error('Order notifications unavailable:', error instanceof Error ? error.message : 'Unknown error');
  }
}
