import webpush, {type PushSubscription} from 'web-push';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {putPushSetting, deletePushSetting, listPushSubscriptions, orderWasSaved, newOrderCount} from './push-storage';

const prefix = 'push-subscription:';
let autoKeys: {publicKey: string; privateKey: string; subject: string} | null = null;

export function pushConfig() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@layane-shop.com';

  if (publicKey && privateKey) {
    return {publicKey, privateKey, subject};
  }

  if (autoKeys) return autoKeys;

  try {
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, {recursive: true});
    const keyFile = path.join(dataDir, 'vapid.json');
    if (fs.existsSync(keyFile)) {
      autoKeys = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
      if (autoKeys?.publicKey && autoKeys?.privateKey) return autoKeys;
    }
    const generated = webpush.generateVAPIDKeys();
    autoKeys = {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
      subject
    };
    fs.writeFileSync(keyFile, JSON.stringify(autoKeys, null, 2));
    return autoKeys;
  } catch {
    const generated = webpush.generateVAPIDKeys();
    autoKeys = {
      publicKey: generated.publicKey,
      privateKey: generated.privateKey,
      subject
    };
    return autoKeys;
  }
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

export async function sendPush(subscription: PushSubscription, payload: {title: string; body: string; tag: string; badgeCount?: number}) {
  if (!validPushEndpoint(subscription.endpoint)) throw new Error('Invalid push service');
  const request = webpush.generateRequestDetails(subscription, JSON.stringify(payload), {
    vapidDetails: pushConfig(), TTL: 86400, urgency: 'high',
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
  try {
    if (!await orderWasSaved(id)) return;
    const rows = await listPushSubscriptions();
    if (!rows.length) return;
    const badgeCount = await newOrderCount().catch(() => undefined);
    await Promise.all(rows.map(async (row: {value: string}) => {
      try {
        await sendPush(JSON.parse(row.value), {
          title: '🚨 طلب جديد في متجر layane-shop!',
          body: `وصلك طلب جديد #${id.slice(0, 8).toUpperCase()}. اضغط هنا لمعاينة تفاصيل الزبون والطلب.`,
          tag: `order-${id}`,
          badgeCount,
        });
      } catch (error) {
        console.error('Order push failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }));
  } catch (error) {
    console.error('Order notifications unavailable:', error instanceof Error ? error.message : 'Unknown error');
  }
}
