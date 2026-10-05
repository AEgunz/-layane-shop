import { notFound } from 'next/navigation';
import Storefront from '@/app/storefront';
import { db, brand, defaultBrand } from '@/lib/store';
import { externalizeDataImages } from '@/lib/externalize-images';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let pageData: any = null;
  let brandData: any = defaultBrand;

  try {
    const row = await db().prepare("SELECT id, slug, data FROM pages WHERE slug=? AND status='published'").bind(slug).first();
    if (row && row.data) {
      const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      if (parsed) {
        // Perf: move any Base64-inlined images out of the page JSON into
        // stored files (runs once, then persists the migrated data).
        let migrated = parsed;
        try {
          const res = await externalizeDataImages(parsed);
          migrated = res.data;
          if (res.changed && row.id) {
            await db()
              .prepare('INSERT INTO pages(id,slug,status,data) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,status=excluded.status,data=excluded.data')
              .bind(row.id, row.slug || slug, 'published', JSON.stringify(migrated))
              .run();
          }
        } catch {}
        pageData = {
          ...migrated,
          name: (!migrated.name || migrated.name === 'Untitled product' || migrated.name === 'Untitled') ? '' : migrated.name,
          images: Array.isArray(migrated.images) ? migrated.images : (migrated.image ? [migrated.image] : []),
          image: migrated.image || (Array.isArray(migrated.images) && migrated.images.length > 0 ? migrated.images[0] : ''),
          reviewsImage: migrated.reviewsImage || ''
        };
      }
    }
  } catch {}

  try {
    brandData = await brand();
  } catch {}

  if (!pageData) notFound();

  return <Storefront slug={slug} page={pageData} brand={brandData} />;
}
