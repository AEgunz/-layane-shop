import Storefront from './storefront';
import { db, brand, defaultBrand } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const defaultPage = {
    id: 'default-product',
    name: 'layane-shop Store',
    slug: 'home',
    price: 249,
    comparePrice: 345,
    shipping: 0,
    status: 'published',
    template: 'editorial',
    language: 'ar',
    headline: 'مرحباً بكم في متجر layane-shop الرسمي',
    description: 'أجود المنتجات الطبيعية عالية الجودة المعروضة بأسعار مميزة مع خدمة التوصيل السريع والدفع عند الاستلام.',
    cta: 'اطلب الآن',
    benefits: 'توصيل سريع مجاني لكافة المدن المغربية\nضمان الجودة والرضا التام 100%\nالدفع نقداً بعد معاينة الشحنة عند الاستلام',
    createdAt: new Date().toISOString()
  };

  let pageData: any = defaultPage;
  let brandData: any = defaultBrand;

  try {
    const row = await db().prepare("SELECT data FROM pages WHERE status='published' ORDER BY rowid ASC").first<{ data: string }>();
    if (row && row.data) {
      pageData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
    }
  } catch {}

  try {
    brandData = await brand();
  } catch {}

  return <Storefront page={pageData} brand={brandData} />;
}
