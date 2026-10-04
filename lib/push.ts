import webpush, {type PushSubscription} from 'web-push';
import {createHash} from 'node:crypto';
import {putPushSetting, deletePushSetting, listPushSubscriptions, orderWasSaved, newOrderCount} from './push-storage';

const prefix = 'push-subscription:';

export function pushConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@layane-shop.com';

  if (publicKey && privateKey) {
    return {publicKey, privateKey, subject};
  }

  throw new Error('VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables are required.');
}

export function validPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    const host = url.hostname.toLowerCase();
    return (
      host === 'fcm.googleapis.com' ||
      host.endsWith('.googleapis.com') ||
      host === 'updates.push.services.mozilla.com' ||
      host.endsWith('.push.services.mozilla.com') ||
      host === 'web.push.apple.com' ||
      host.endsWith('.push.apple.com') ||
      host.endsWith('.notify.windows.com')
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

export async function sendPush(subscription: PushSubscription, payload: {title: string; body: string; tag: string; badgeCount?: number}) {
  if (!validPushEndpoint(subscription.endpoint)) throw new Error('Invalid push service');
  const request = webpush.generateRequestDetails(subscription, JSON.stringify(payload), {
    vapidDetails: pushConfig(),
    TTL: 86400,
    urgency: 'high',
  });
  const response = await fetch(request.endpoint, {
    method: 'POST',
    headers: request.headers as Record<string, string>,
    body: new Uint8Array(request.body!),
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404 || response.status === 410) {
    await removeSubscription(subscription.endpoint);
  }
  if (!response.ok) throw new Error(`Push service rejected notification (${response.status})`);
}

export async function notifyNewOrder(id: string, details?: { customer?: string; city?: string; total?: number; product?: string }) {
  try {
    if (!details && !await orderWasSaved(id)) return;
    const rows = await listPushSubscriptions();
    if (!rows || !rows.length) return;
    const badgeCount = await newOrderCount().catch(() => undefined);

    let bodyText = `وصلك طلب جديد #${id.slice(0, 8).toUpperCase()}. اضغط هنا لمعاينة التفاصيل.`;
    if (details?.customer && details?.total) {
      bodyText = `الزبون: ${details.customer} (${details.city || ''}) • المجموع: ${details.total} DH`;
    }

    await Promise.all(rows.map(async (row: {value: string}) => {
      try {
        const sub = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        await sendPush(sub, {
          title: '🚨 طلب جديد في متجر layane-shop!',
          body: bodyText,
          tag: `order-${id}`,
          badgeCount,
        });
      } catch (error) {
        console.error('Order push failed for subscription:', error instanceof Error ? error.message : 'Unknown error');
      }
    }));
  } catch (error) {
    console.error('Order notifications unavailable:', error instanceof Error ? error.message : 'Unknown error');
  }
}
