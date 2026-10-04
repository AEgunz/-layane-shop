import {admin, error, originCheck, getSessionPermissions} from '@/lib/store';
import {pushConfig, validPushEndpoint, saveSubscription, removeSubscription, sendPush} from '@/lib/push';
import {z} from 'zod';

export const dynamic = 'force-dynamic';

const subscriptionSchema = z.object({
  endpoint: z.string().max(2048).refine(validPushEndpoint),
  keys: z.object({
    p256dh: z.string().min(16).max(512),
    auth: z.string().min(8).max(256),
  }),
});

async function authorize() {
  await admin();
  if (!(await getSessionPermissions()).includes('Orders')) throw new Error('FORBIDDEN');
}

function pushError(e: unknown) {
  const message = e instanceof Error ? e.message : '';
  if (message.includes('VAPID_PUBLIC_KEY')) return Response.json({error: message}, {status: 503});
  if (message.startsWith('Push storage requires')) {
    return Response.json({error: 'خاص إعداد SUPABASE_SERVICE_ROLE_KEY فالسيرفر لحفظ اشتراك الإشعارات.'}, {status: 503});
  }
  if (message.startsWith('Push service rejected')) {
    return Response.json({error: 'خدمة الإشعارات رفضت الإرسال. أعد تفعيل الإشعارات وتأكد من مفاتيح السيرفر.'}, {status: 502});
  }
  return error(e);
}

function checkOrigin(request: Request) {
  originCheck(request);
}

export async function GET() {
  try {
    await authorize();
    return Response.json({publicKey: pushConfig().publicKey}, {headers: {'Cache-Control': 'no-store'}});
  } catch (e) { return pushError(e); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    await authorize();
    const body = z.object({subscription: subscriptionSchema, test: z.boolean().optional()}).parse(await request.json());
    pushConfig();
    await saveSubscription(body.subscription);
    if (body.test) await sendPush(body.subscription, {
      title: 'إشعارات layane-shop مفعّلة 🔔',
      body: 'هذا إشعار تجريبي. ستصلك الطلبات الجديدة على هذا الجهاز حتى عندما تكون نافذة التطبيق مغلقة.',
      tag: 'layane-push-test',
    });
    return Response.json({ok: true});
  } catch (e) { return pushError(e); }
}

export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await admin();
    const {endpoint} = z.object({endpoint: z.string().max(2048).refine(validPushEndpoint)}).parse(await request.json());
    await removeSubscription(endpoint);
    return Response.json({ok: true});
  } catch (e) { return pushError(e); }
}
