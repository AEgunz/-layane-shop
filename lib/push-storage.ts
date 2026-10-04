import {db} from './store';

function supabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return null;
  return {url: url.replace(/\/$/, ''), key};
}

async function rest(path: string, init: RequestInit = {}) {
  const config = supabase();
  if (!config) throw new Error('Push storage requires database configuration.');
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {apikey: config.key, Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json', ...init.headers},
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Push storage failed (${response.status})`);
  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

export async function putPushSetting(key: string, value: string) {
  if (supabase()) {
    await rest('settings?on_conflict=key', {method: 'POST', headers: {Prefer: 'resolution=merge-duplicates'}, body: JSON.stringify({key, value})});
  } else {
    await db().prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key, value).run();
    const saved = await db().prepare('SELECT value FROM settings WHERE key=?').bind(key).first();
    if (saved?.value !== value) throw new Error('Unable to save push subscription');
  }
}

export async function deletePushSetting(key: string) {
  if (supabase()) await rest(`settings?key=eq.${encodeURIComponent(key)}`, {method: 'DELETE'});
  else await db().prepare('DELETE FROM settings WHERE key=?').bind(key).run();
}

export async function listPushSubscriptions(): Promise<{value: string}[]> {
  if (supabase()) return rest('settings?key=like.push-subscription:%25&select=value');
  const rows = await db().prepare('SELECT value FROM settings WHERE key LIKE ?').bind('push-subscription:%').all();
  return rows.results || [];
}

export async function orderWasSaved(id: string) {
  if (supabase()) return (await rest(`orders?id=eq.${encodeURIComponent(id)}&select=id`)).length > 0;
  return Boolean(await db().prepare('SELECT id FROM orders WHERE id=?').bind(id).first());
}

export async function newOrderCount(): Promise<number> {
  const config = supabase();
  if (config) {
    const response = await fetch(`${config.url}/rest/v1/orders?status=eq.new&select=id`, {
      method: 'HEAD',
      headers: {apikey: config.key, Authorization: `Bearer ${config.key}`, Prefer: 'count=exact'},
      signal: AbortSignal.timeout(8000),
    });
    const total = response.headers.get('content-range')?.split('/')[1];
    if (!response.ok || !total || !/^\d+$/.test(total)) throw new Error('Unable to count new orders');
    return Number(total);
  }
  const row = await db().prepare("SELECT count(*) AS count FROM orders WHERE status='new'").first();
  if (row?.count == null) throw new Error('Unable to count new orders');
  return Number(row.count);
}
