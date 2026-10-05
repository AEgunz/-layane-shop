import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

/**
 * Mobile performance fix.
 *
 * Uploaded product images were stored as Base64 Data URLs inside the page
 * JSON (serverless read-only fallback in /api/upload). That inlined ~5 MB of
 * base64 into the HTML of every page render → FCP/LCP ~20 s on mobile.
 *
 * This helper walks the page data, extracts every `data:image/...;base64,...`
 * payload, stores it as a real file (R2 bucket on Cloudflare, local disk
 * otherwise) and replaces the data URL with a cacheable URL. Callers persist
 * the migrated page data back to the DB so the migration runs only once.
 */

function getCloudflareBucket() {
  try {
    // @ts-ignore
    const { env } = require('cloudflare:workers');
    return env?.BUCKET || null;
  } catch {
    return null;
  }
}

const DATA_URL_RE = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/;
const DATA_URL_GLOBAL_RE = /data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+/g;

// In-request dedupe: identical images appear multiple times in a page.
const hashToUrl = new Map<string, string>();

async function storeImage(ext: string, bytes: Uint8Array): Promise<string | null> {
  const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
  const hash = crypto.createHash('sha1').update(bytes).digest('hex');
  const key = `${hash}.${normalizedExt}`;

  const cached = hashToUrl.get(key);
  if (cached) return cached;

  const contentType = `image/${normalizedExt === 'jpg' ? 'jpeg' : normalizedExt}`;
  let url: string | null = null;

  const bucket = getCloudflareBucket();
  if (bucket) {
    try {
      // R2 put is idempotent for the same key.
      await bucket.put(key, bytes, { httpMetadata: { contentType } });
      url = '/assets/uploads/' + key;
    } catch {}
  }

  if (!url) {
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      const filePath = path.join(uploadsDir, key);
      if (!fs.existsSync(filePath)) {
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        fs.writeFileSync(filePath, Buffer.from(bytes));
      }
      const distUploadsDir = path.join(process.cwd(), 'dist', 'client', 'uploads');
      if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
        const distFilePath = path.join(distUploadsDir, key);
        if (!fs.existsSync(distFilePath)) {
          if (!fs.existsSync(distUploadsDir)) fs.mkdirSync(distUploadsDir, { recursive: true });
          fs.writeFileSync(distFilePath, Buffer.from(bytes));
        }
      }
      url = '/uploads/' + key;
    } catch {}
  }

  if (url) hashToUrl.set(key, url);
  return url;
}

function decodeBase64(b64: string): Uint8Array | null {
  try {
    return new Uint8Array(Buffer.from(b64.replace(/\s/g, ''), 'base64'));
  } catch {
    return null;
  }
}

async function replaceInString(value: string, changed: { v: boolean }): Promise<string> {
  // Whole-string data URL (typical: image fields)
  const whole = value.match(DATA_URL_RE);
  if (whole) {
    const bytes = decodeBase64(whole[2]);
    if (!bytes) return value;
    const url = await storeImage(whole[1], bytes);
    if (url) {
      changed.v = true;
      return url;
    }
    return value;
  }

  // Embedded data URLs inside larger HTML strings (customHtml fields)
  if (value.length > 64 && value.includes('data:image/')) {
    const matches = value.match(DATA_URL_GLOBAL_RE);
    if (!matches) return value;
    let out = value;
    for (const m of matches) {
      const parts = m.match(DATA_URL_RE);
      if (!parts) continue;
      const bytes = decodeBase64(parts[2]);
      if (!bytes) continue;
      const url = await storeImage(parts[1], bytes);
      if (url) {
        out = out.split(m).join(url);
        changed.v = true;
      }
    }
    return out;
  }

  return value;
}

async function walk(node: any, changed: { v: boolean }): Promise<any> {
  if (typeof node === 'string') {
    if (node.length < 64 || !node.startsWith('data:image/') && !node.includes('data:image/')) return node;
    return replaceInString(node, changed);
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      node[i] = await walk(node[i], changed);
    }
    return node;
  }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) {
      node[k] = await walk(node[k], changed);
    }
    return node;
  }
  return node;
}

/**
 * Replace every Base64 data-URL image in `data` with a stored file URL.
 * Mutates and returns `data`; `changed` tells the caller to persist it.
 */
export async function externalizeDataImages(data: any): Promise<{ data: any; changed: boolean }> {
  const changed = { v: false };
  if (!data || typeof data !== 'object') return { data, changed: false };
  await walk(data, changed);
  return { data, changed: changed.v };
}
