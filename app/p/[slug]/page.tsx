import { notFound } from 'next/navigation';
import Storefront from '@/app/storefront';
import { db, brand, defaultBrand } from '@/lib/store';
import { prepareProductImages } from '@/lib/product-images';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let pageData: any = null;
  let brandData: any = defaultBrand;
  const brandPromise = brand().catch(() => defaultBrand);

  try {
    const row = await db().prepare("SELECT id, data FROM pages WHERE slug=? AND status='published'").bind(slug).first();
    if (row && row.data) {
      const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      if (parsed) {
        pageData = {
          ...parsed,
          name: (!parsed.name || parsed.name === 'Untitled product' || parsed.name === 'Untitled') ? '' : parsed.name,
          images: Array.isArray(parsed.images) ? parsed.images : (parsed.image ? [parsed.image] : []),
          image: parsed.image || (Array.isArray(parsed.images) && parsed.images.length > 0 ? parsed.images[0] : ''),
          reviewsImage: parsed.reviewsImage || ''
        };
        pageData = (await prepareProductImages(pageData, row.id)).data;
      }
    }
  } catch {}

  try {
    brandData = await brandPromise;
  } catch {}

  if (!pageData) notFound();

  return <Storefront slug={slug} page={pageData} brand={brandData} />;
}
