import Storefront from './storefront';
import { db, brand, defaultBrand } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const defaultPage = {
    id: 'default-product',
    name: 'باك الراحة والشفاء الطبيعي',
    slug: 'home',
    price: 249,
    comparePrice: 345,
    shipping: 0,
    status: 'published',
    template: 'editorial',
    language: 'ar',
    headline: 'المنتج الأكثر طلباً وشهرة بالمغرب • نتائج مضمونة 100%',
    description: 'أجود المنتجات الطبيعية عالية الجودة المعروضة بأسعار مميزة مع خدمة التوصيل السريع والدفع عند الاستلام.',
    image: '/assets/bundle.png',
    images: ['/assets/bundle.png', '/assets/brace.png', '/assets/balm.png'],
    reviewsImage: '/assets/faq.png',
    cta: 'اضغط هنا للطلب والدفع عند الاستلام',
    benefits: 'توصيل سريع مجاني لكافة المدن المغربية\nضمان الجودة والرضا التام 100%\nالدفع نقداً بعد معاينة الشحنة عند الاستلام',
    createdAt: new Date().toISOString()
  };

  let pageData: any = defaultPage;
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
      if (!chosen) {
        chosen = pagesList.find((p: any) => p.id !== 'default-product' && p.slug !== 'home' && p.data?.id !== 'default-product');
      }
      if (!chosen) {
        chosen = pagesList[pagesList.length - 1];
      }
      if (chosen && chosen.data) {
        pageData = chosen.data;
      }
    }
  } catch {}

  try {
    brandData = await brand();
  } catch {}

  return <Storefront page={pageData} brand={brandData} />;
}
