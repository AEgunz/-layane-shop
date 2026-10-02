import {getChatGPTUser} from '@/app/chatgpt-auth';
import {ZodError} from 'zod';
import path from 'node:path';
import fs from 'node:fs';
import {cookies} from 'next/headers';

export const defaultBrand={name:'layane-shop',tagline:'Care for your everyday',color:'#205b44',logo:'/logo.png',phone:'',currency:'MAD'};

let nodeD1Instance: any = null;

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
  try {
    // @ts-ignore
    const { env } = require('cloudflare:workers');
    if (env?.DB) return env.DB;
  } catch {}

  const localDb = getNodeD1();
  if (localDb) return localDb;

  throw new Error('Store storage unavailable. Please try again.');
}

export async function brand(){
  try {
    const row=await db().prepare("SELECT value FROM settings WHERE key='brand'").first<{value:string}>();
    if (row) {
      const parsed = JSON.parse(row.value);
      if (!parsed.logo) parsed.logo = '/logo.png';
      return parsed;
    }
    return defaultBrand;
  } catch {
    return defaultBrand;
  }
}

export async function admin(){
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (session && session.value === 'logged_in') {
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
export function originCheck(r:Request){const o=r.headers.get('origin');if(o&&o!==new URL(r.url).origin)throw new Error('Invalid origin');}
