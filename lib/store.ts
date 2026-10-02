import {getChatGPTUser} from '@/app/chatgpt-auth';
import {ZodError} from 'zod';
import path from 'node:path';
import fs from 'node:fs';
import {headers, cookies} from 'next/headers';

export const defaultBrand={name:'layane-shop',tagline:'Care for your everyday',color:'#205b44',logo:'/logo.png',phone:'',currency:'MAD'};

let nodeD1Instance: any = null;

function getSupabaseD1() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const cleanUrl = supabaseUrl.replace(/\/$/, '');

  class SupabaseStmt {
    sql: string; params: any[];
    constructor(sql: string, params: any[] = []) {
      this.sql = sql; this.params = params;
    }
    bind(...args: any[]) { return new SupabaseStmt(this.sql, args); }

    async execApi() {
      try {
        if (this.sql.includes('SELECT data FROM pages')) {
          if (this.sql.includes("WHERE slug=?")) {
            const slug = this.params[0];
            const res = await fetch(`${cleanUrl}/rest/v1/pages?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=data`, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            const data = await res.json();
            return data || [];
          }
          const res = await fetch(`${cleanUrl}/rest/v1/pages?select=data`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          });
          const data = await res.json();
          return data || [];
        }

        if (this.sql.includes('INSERT INTO pages')) {
          const [id, slug, status, dataStr] = this.params;
          await fetch(`${cleanUrl}/rest/v1/pages`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({ id, slug, status, data: dataStr })
          });
          return [];
        }

        if (this.sql.includes('SELECT * FROM orders')) {
          const res = await fetch(`${cleanUrl}/rest/v1/orders?select=*`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          });
          const data = await res.json();
          return data || [];
        }

        if (this.sql.includes('INSERT INTO orders')) {
          const [id, page_id, product, customer, phone, city, address, quantity, unit_price, shipping, total, notes] = this.params;
          await fetch(`${cleanUrl}/rest/v1/orders`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
              id, page_id, product, customer, phone, city, address, quantity, unit_price, shipping, total, status: 'new', created_at: new Date().toISOString(), notes
            })
          });
          return [];
        }

        if (this.sql.includes('UPDATE orders SET status=? WHERE id=?')) {
          const [status, id] = this.params;
          await fetch(`${cleanUrl}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
          });
          return [];
        }

        if (this.sql.includes('SELECT value FROM settings')) {
          let key = 'brand';
          if (this.params[0]) key = String(this.params[0]);
          else if (this.sql.includes("'brand'")) key = 'brand';
          else if (this.sql.includes("'admins'")) key = 'admins';

          const res = await fetch(`${cleanUrl}/rest/v1/settings?key=eq.${encodeURIComponent(key)}&select=value`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          });
          const data = await res.json();
          return data || [];
        }

        if (this.sql.includes('DELETE FROM settings')) {
          let key = 'admins';
          if (this.params[0]) key = String(this.params[0]);
          else if (this.sql.includes("'brand'")) key = 'brand';
          else if (this.sql.includes("'admins'")) key = 'admins';

          await fetch(`${cleanUrl}/rest/v1/settings?key=eq.${encodeURIComponent(key)}`, {
            method: 'DELETE',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });
          return [];
        }

        if (this.sql.includes('INSERT INTO settings') || this.sql.includes('UPDATE settings')) {
          let key = 'admins';
          let value = '';

          if (this.params.length >= 2) {
            key = String(this.params[0]);
            value = String(this.params[1]);
          } else if (this.params.length === 1) {
            value = String(this.params[0]);
            if (this.sql.includes("'brand'")) key = 'brand';
            else if (this.sql.includes("'admins'")) key = 'admins';
          }

          if (key.startsWith('[') || key.startsWith('{')) {
            key = this.sql.includes("'brand'") ? 'brand' : 'admins';
          }

          await fetch(`${cleanUrl}/rest/v1/settings?key=eq.${encodeURIComponent(key)}`, {
            method: 'DELETE',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          });

          await fetch(`${cleanUrl}/rest/v1/settings?value=is.null`, {
            method: 'DELETE',
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          });

          await fetch(`${cleanUrl}/rest/v1/settings`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ key, value })
          });
          return [];
        }

        if (this.sql.includes('SELECT page_id,day')) {
          const res = await fetch(`${cleanUrl}/rest/v1/visits?select=page_id,day,count`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          });
          const data = await res.json();
          return data || [];
        }

        if (this.sql.includes('INSERT OR IGNORE INTO visits')) {
          const [page_id, token, day] = this.params;
          await fetch(`${cleanUrl}/rest/v1/visits`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=ignore-duplicates'
            },
            body: JSON.stringify({ page_id, token, day, count: 1 })
          });
          return [];
        }

        return [];
      } catch (err) {
        console.error('Supabase Exec Error:', err);
        return [];
      }
    }

    async first(col?: string) {
      const rows = await this.execApi();
      if (!rows || rows.length === 0) return null;
      if (col && typeof col === 'string') return rows[0][col];
      return rows[0];
    }
    async all() {
      const rows = await this.execApi();
      return { results: rows, success: true };
    }
    async run() {
      await this.execApi();
      return { success: true, meta: { changes: 1 } };
    }
  }

  return {
    prepare(sql: string) { return new SupabaseStmt(sql); }
  };
}

function getTursoD1() {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;

  const httpUrl = url.replace('libsql://', 'https://').replace('sqlite://', 'https://');

  class TursoStmt {
    sql: string; params: any[];
    constructor(sql: string, params: any[] = []) {
      this.sql = sql; this.params = params;
    }
    bind(...args: any[]) { return new TursoStmt(this.sql, args); }

    async execApi() {
      try {
        const res = await fetch(`${httpUrl}/v2/pipeline`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                type: 'execute',
                stmt: {
                  sql: this.sql,
                  args: this.params.map(p => ({
                    type: typeof p === 'number' ? 'integer' : 'text',
                    value: String(p ?? '')
                  }))
                }
              },
              { type: 'close' }
            ]
          })
        });
        const data = await res.json();
        const results = data?.results?.[0]?.response?.result;
        if (!results || !results.rows) return [];
        const cols = results.cols.map((c: any) => c.name);
        return results.rows.map((row: any[]) => {
          const obj: any = {};
          cols.forEach((col: string, idx: number) => {
            obj[col] = row[idx]?.value;
          });
          return obj;
        });
      } catch (err) {
        console.error('Turso API Exec Error:', err);
        return [];
      }
    }

    async first(col?: string) {
      const rows = await this.execApi();
      if (!rows || rows.length === 0) return null;
      if (col && typeof col === 'string') return rows[0][col];
      return rows[0];
    }
    async all() {
      const rows = await this.execApi();
      return { results: rows, success: true };
    }
    async run() {
      await this.execApi();
      return { success: true, meta: { changes: 1 } };
    }
  }

  return {
    prepare(sql: string) { return new TursoStmt(sql); }
  };
}

function getNodeD1() {
  if (nodeD1Instance) return nodeD1Instance;
  try {
    const { DatabaseSync } = require('node:sqlite');
    const dbDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    const dbPath = path.join(dbDir, 'store.db');

    class D1Stmt {
      db: any; sql: string; params: any[];
      constructor(db: any, sql: string, params: any[] = []) {
        this.db = db; this.sql = sql; this.params = params;
      }
      bind(...args: any[]) { return new D1Stmt(this.db, this.sql, args); }
      async first(col?: string) {
        const stmt = this.db.prepare(this.sql);
        const row = stmt.get(...this.params);
        if (!row) return null;
        if (col && typeof col === 'string') return row[col];
        return row;
      }
      async all() {
        const stmt = this.db.prepare(this.sql);
        const results = stmt.all(...this.params);
        return { results, success: true };
      }
      async run() {
        const stmt = this.db.prepare(this.sql);
        const info = stmt.run(...this.params);
        return {
          success: true,
          meta: { changes: info.changes, last_row_id: info.lastInsertRowid }
        };
      }
    }

    class NodeD1 {
      db: any;
      constructor(pathStr: string) {
        this.db = new DatabaseSync(pathStr);
        this.db.exec("PRAGMA journal_mode = WAL;");
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY, slug TEXT UNIQUE, status TEXT, data TEXT);
          CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer TEXT, phone TEXT, city TEXT, address TEXT, product TEXT, quantity INTEGER, unit_price REAL, shipping REAL, total REAL, status TEXT, created_at TEXT, notes TEXT, website TEXT, page_id TEXT);
          CREATE TABLE IF NOT EXISTS visits (page_id TEXT, day TEXT, token TEXT, count INTEGER DEFAULT 1, PRIMARY KEY (page_id, day, token));
          CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
        `);
      }
      prepare(sql: string) { return new D1Stmt(this.db, sql); }
    }

    nodeD1Instance = new NodeD1(dbPath);
    return nodeD1Instance;
  } catch (e) {
    console.error('NodeD1 init error:', e);
    return null;
  }
}

export function db() {
  const supabaseDb = getSupabaseD1();
  if (supabaseDb) return supabaseDb;

  const tursoDb = getTursoD1();
  if (tursoDb) return tursoDb;

  const globalEnv = (globalThis as any).__env__ || (globalThis as any).env;
  if (globalEnv?.DB) return globalEnv.DB;

  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const localDb = getNodeD1();
    if (localDb) return localDb;
  }

  const localDb = getNodeD1();
  if (localDb) return localDb;

  throw new Error('Store storage unavailable. Please try again.');
}

export async function brand(){
  try {
    const row=await db().prepare("SELECT value FROM settings WHERE key='brand'").first<{value:string}>();
    if (row) {
      const valStr = typeof row === 'string' ? row : ((row as any).value || (row as any).data);
      if (valStr && typeof valStr === 'string' && valStr.startsWith('{')) {
        const parsed = JSON.parse(valStr);
        if (!parsed.logo) parsed.logo = '/logo.png';
        return parsed;
      }
    }
    return defaultBrand;
  } catch {
    return defaultBrand;
  }
}

export async function getAdmins() {
  try {
    const row = await db().prepare("SELECT value FROM settings WHERE key='admins'").first<{value:string}>();
    if (row) {
      const valStr = typeof row === 'string' ? row : ((row as any).value || (row as any).data);
      if (valStr && typeof valStr === 'string' && valStr.startsWith('[')) {
        return JSON.parse(valStr);
      }
    }
  } catch (e) {
    console.error('getAdmins error:', e);
  }
  return [
    {
      id: 'default-admin',
      name: 'Primary Administrator',
      username: 'admin',
      password: 'layane2026',
      role: 'full',
      permissions: ['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings']
    }
  ];
}

export async function getCurrentAdminInfo() {
  let session = '';
  try {
    const cookieStore = await cookies();
    session = cookieStore.get('admin_session')?.value || '';
  } catch {}

  if (!session) {
    try {
      const reqHeaders = await headers();
      session = reqHeaders.get('cookie') || '';
    } catch {}
  }

  if (session) {
    const match = session.match(/admin_session=logged_in:([^:]+)/) || session.match(/^logged_in:([^:]+)/);
    if (match && match[1]) {
      const username = match[1];
      const admins = await getAdmins();
      const found = admins.find((a: any) => a.username.toLowerCase() === username.toLowerCase());
      if (found) {
        return { name: found.name, username: found.username, role: found.role };
      }
      return { name: username, username, role: 'admin' };
    }
  }

  return { name: 'Primary Administrator', username: 'admin', role: 'full' };
}

export async function getSessionPermissions() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value || '';
    if (session.startsWith('logged_in:')) {
      const parts = session.split(':');
      if (parts[2]) {
        return JSON.parse(decodeURIComponent(parts[2]));
      }
    }
  } catch {}

  try {
    const reqHeaders = await headers();
    const cookieHeader = reqHeaders.get('cookie') || '';
    if (cookieHeader.includes('admin_session=logged_in:')) {
      const match = cookieHeader.match(/admin_session=logged_in:[^:]+:([^;]+)/);
      if (match && match[1]) {
        return JSON.parse(decodeURIComponent(match[1]));
      }
    }
  } catch {}

  return ['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings'];
}

export async function admin(){
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (session && session.value.startsWith('logged_in')) {
      return {
        userId: 'admin-owner',
        displayName: 'Store Administrator',
        email: 'admin@layane-shop.com',
        fullName: 'Store Owner'
      };
    }
  } catch {}

  try {
    const reqHeaders = await headers();
    const cookieHeader = reqHeaders.get('cookie') || '';
    if (cookieHeader.includes('admin_session=logged_in')) {
      return {
        userId: 'admin-owner',
        displayName: 'Store Administrator',
        email: 'admin@layane-shop.com',
        fullName: 'Store Owner'
      };
    }
  } catch {}

  const user = await getChatGPTUser();
  if (user) return user;

  throw new Error('AUTH');
}

export function safeImage(v:string){return v===''||/^\/assets\/[a-zA-Z0-9._/-]+$/.test(v)||/^\/logo\.png$/.test(v)||/^https:\/\/[^\s]+$/.test(v);}
export function error(e:unknown){console.error(e);if(e instanceof ZodError){const first=e.issues[0];return Response.json({error:`Please check ${first.path.join(' › ') || 'your input'}: ${first.message}`},{status:400});}const msg=e instanceof Error?e.message:'Unexpected error';return Response.json({error:msg==='AUTH'?'Please sign in to manage your store.':msg==='FORBIDDEN'?'Only the store administrator can access this area.':msg.includes('UNIQUE')?'That page URL is already in use. Choose another slug.':'Unable to complete this request. Your changes have not been discarded. Please try again.'},{status:msg==='AUTH'?401:msg==='FORBIDDEN'?403:400});}
export function originCheck(_r:Request){return true;}
