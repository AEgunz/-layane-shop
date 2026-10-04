import Storefront from './storefront';
import { db, brand, defaultBrand } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let pageData: any = null;
  let brandData: any = defaultBrand;

  try {
    let targetPageId = '';
    try {
      const mainHomeSetting = await db().prepare("SELECT value FROM settings WHERE key='main_home_page_id'").first<{ value: string }>();
      if (mainHomeSetting) {
        targetPageId = typeof mainHomeSetting === 'string' ? mainHomeSetting : (mainHomeSetting.value || '');
      }
    } catch {}

    const allPagesRes = await db().prepare("SELECT id, slug, data FROM pages WHERE status='published'").all<{ id: string; slug: string; data: string }>();
    const pagesList = (allPagesRes?.results || []).map((r: any) => {
      try {
        const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
        return { id: r.id || d?.id, slug: r.slug || d?.slug, data: d };
      } catch {
        return null;
      }
    }).filter((x: any) => x && x.data);

    if (pagesList.length > 0) {
      let chosen: any = null;
      if (targetPageId) {
        chosen = pagesList.find((p: any) => p.id === targetPageId || p.data?.id === targetPageId);
      }
      if (chosen && chosen.data) {
        pageData = chosen.data;
      }
    }
  } catch {}

  try {
    brandData = await brand();
  } catch {}

  if (!pageData) {
    return <main dir="rtl" style={{minHeight: '100dvh', display: 'grid', placeContent: 'center', textAlign: 'center', padding: 24}}>
      <h1>{brandData.name}</h1>
      <p>مرحباً بكم، سيتم عرض منتجاتنا هنا قريباً.</p>
    </main>;
  }

  return <Storefront page={pageData} brand={brandData} />;
}
