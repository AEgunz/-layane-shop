import Storefront from './storefront';
import { db, brand, defaultBrand } from '@/lib/store';
import { externalizeDataImages } from '@/lib/externalize-images';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let pageData: any = null;
  let brandData: any = defaultBrand;

  try {
    let targetPageId = '';
    try {
      const mainHomeSetting = await db().prepare("SELECT value FROM settings WHERE key='main_home_page_id'").first();
      if (mainHomeSetting) {
        targetPageId = typeof mainHomeSetting === 'string' ? mainHomeSetting : (mainHomeSetting.value || '');
      }
    } catch {}

    const allPagesRes = await db().prepare("SELECT id, slug, data FROM pages WHERE status='published'").all();
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
        // Perf: move any Base64-inlined images out of the page JSON into
        // stored files (runs once, then persists the migrated data).
        try {
          const { data: migrated, changed } = await externalizeDataImages(chosen.data);
          if (changed) {
            await db()
              .prepare('INSERT INTO pages(id,slug,status,data) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,status=excluded.status,data=excluded.data')
              .bind(chosen.id, chosen.slug || migrated.slug || '', 'published', JSON.stringify(migrated))
              .run();
          }
          pageData = migrated;
        } catch {
          pageData = chosen.data;
        }
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
