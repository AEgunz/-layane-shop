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

export async function GET(r: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!key || !/^[a-zA-Z0-9._-]+$/.test(key)) {
    return new Response('Not found', { status: 404 });
  }

  const bucket = getCloudflareBucket();
  if (bucket) {
    try {
      const obj = await bucket.get(key);
      if (obj) {
        return new Response(obj.body, {
          headers: {
            'Content-Type': obj.httpMetadata?.contentType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        });
      }
    } catch {}
  }

  const possiblePaths = [
    path.join(process.cwd(), 'public', 'uploads', key),
    path.join(process.cwd(), 'dist', 'client', 'uploads', key),
    path.join(process.cwd(), 'dist', 'standalone', 'client', 'uploads', key),
    path.join(process.cwd(), 'public', 'assets', key)
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(key).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';
      const fileBuffer = fs.readFileSync(filePath);
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }
  }

  return new Response('Not found', { status: 404 });
}
