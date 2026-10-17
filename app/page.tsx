import Storefront from './storefront';
import { db, brand, defaultBrand } from '@/lib/store';
import { prepareProductImages } from '@/lib/product-images';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  const defaultFallbackPage = {
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
      const row = await db().prepare("SELECT id, data FROM pages WHERE id=? AND status='published' LIMIT 1").bind(targetPageId).first();
      if (row?.data) {
        const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        pageData = (await prepareProductImages(parsed, row.id || targetPageId)).data;
      }
    }

    if (!pageData) {
      const row = await db().prepare("SELECT id, data FROM pages WHERE status='published' ORDER BY rowid DESC LIMIT 1").first();
      if (row?.data) {
        const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        pageData = (await prepareProductImages(parsed, row.id)).data;
      }
    }

    if (!pageData) {
      const row = await db().prepare("SELECT id, data FROM pages ORDER BY rowid DESC LIMIT 1").first();
      if (row?.data) {
        const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        pageData = (await prepareProductImages(parsed, row.id)).data;
      }
    }
  } catch {}

  try {
    brandData = await brandPromise;
  } catch {}

  if (!pageData) {
    pageData = defaultFallbackPage;
  }

  return <Storefront page={pageData} brand={brandData} />;
}
