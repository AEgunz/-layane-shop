import Storefront from './storefront';
import { db, brand, defaultBrand } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let pageData: any = null;
  let brandData: any = defaultBrand;
  const brandPromise = brand().catch(() => defaultBrand);

  try {
    let targetPageId = '';
    try {
      const mainHomeSetting = await db().prepare("SELECT value FROM settings WHERE key='main_home_page_id'").first();
      if (mainHomeSetting) {
        targetPageId = typeof mainHomeSetting === 'string' ? mainHomeSetting : (mainHomeSetting.value || '');
      }
    } catch {}

    if (targetPageId) {
      const row = await db().prepare("SELECT data FROM pages WHERE id=? AND status='published' LIMIT 1").bind(targetPageId).first();
      if (row?.data) {
        pageData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      }
    }
  } catch {}

  try {
    brandData = await brandPromise;
  } catch {}

  if (!pageData) {
    return <main dir="rtl" style={{minHeight: '100dvh', display: 'grid', placeContent: 'center', textAlign: 'center', padding: 24}}>
      <h1>{brandData.name}</h1>
      <p>مرحباً بكم، سيتم عرض منتجاتنا هنا قريباً.</p>
    </main>;
  }

  return <Storefront page={pageData} brand={brandData} />;
}
