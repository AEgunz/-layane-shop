import Storefront from '@/app/storefront';
import { db, brand, defaultBrand } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let pageData: any = null;
  let brandData: any = defaultBrand;

  try {
    const row = await db().prepare("SELECT data FROM pages WHERE slug=? AND status='published'").bind(slug).first<{ data: string }>();
    if (row && row.data) {
      pageData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    }
  } catch {}

  try {
    brandData = await brand();
  } catch {}

  return <Storefront slug={slug} page={pageData} brand={brandData} />;
}
