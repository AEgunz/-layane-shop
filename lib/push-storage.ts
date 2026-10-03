import {db} from './store';

// Keep push storage independent from the storefront's legacy SQL adapter.
function supabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Push storage requires SUPABASE_SERVICE_ROLE_KEY on the server.');
  return {url: url.replace(/\/$/, ''), key};
}

async function rest(path: string, init: RequestInit = {}) {
  const config = supabase()!;
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
  if (supabase()) return rest('settings?key=like.push-subscription:*&select=value');
  const rows = await db().prepare('SELECT value FROM settings WHERE key LIKE ?').bind('push-subscription:%').all();
  return rows.results || [];
}

export async function orderWasSaved(id: string) {
  if (supabase()) return (await rest(`orders?id=eq.${encodeURIComponent(id)}&select=id`)).length > 0;
  return Boolean(await db().prepare('SELECT id FROM orders WHERE id=?').bind(id).first());
}
