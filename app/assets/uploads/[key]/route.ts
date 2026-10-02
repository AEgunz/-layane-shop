import path from 'node:path';
import fs from 'node:fs';

export const dynamic = 'force-dynamic';

function getCloudflareBucket() {
  try {
    // @ts-ignore
    const { env } = require('cloudflare:workers');
    return env?.BUCKET || null;
  } catch {
    return null;
  }
}

export async function GET(r:Request,{params}:{params:Promise<{key:string}>}){
  const {key}=await params;
  if(!/^[a-f0-9-]+\.(png|jpg|webp)$/.test(key)) return new Response('Not found',{status:404});

  const bucket = getCloudflareBucket();
  if (bucket) {
    const obj = await bucket.get(key);
    if (!obj) return new Response('Not found',{status:404});
    return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});
  }

  // Node.js local file storage fallback
  const filePath = path.join(process.cwd(), 'public', 'uploads', key);
  if (!fs.existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const ext = path.extname(key).toLowerCase();
  const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.png' ? 'image/png' : 'image/webp';
  const fileBuffer = fs.readFileSync(filePath);

  return new Response(fileBuffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
