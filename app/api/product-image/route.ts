import { db } from '@/lib/store';
import { cachedProductImage, prepareProductImages } from '@/lib/product-images';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const pageId = params.get('page') || '';
  const hash = params.get('image') || '';
  if (!pageId || pageId.length > 200 || !/^[a-f0-9]{64}$/.test(hash)) {
    return new Response('Invalid image', { status: 400 });
  }
  try {
    let asset = cachedProductImage(pageId, hash);
    if (!asset) {
      const row = await db().prepare("SELECT data FROM pages WHERE id=? AND status='published' LIMIT 1").bind(pageId).first();
      if (row?.data) {
        const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        asset = (await prepareProductImages(data, pageId, hash)).image;
      }
    }
    if (!asset) return new Response('Image not found', { status: 404 });
    return new Response(new Uint8Array(asset.bytes), { headers: {
      'Content-Type': asset.contentType,
      'Content-Length': String(asset.bytes.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch {
    return new Response('Image temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
