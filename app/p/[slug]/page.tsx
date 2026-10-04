import Storefront from '@/app/storefront';
import { db, brand, defaultBrand } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const defaultPage = {
    id: 'product-' + slug,
    name: 'باك الراحة والشفاء الطبيعي',
    slug,
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
    const row = await db().prepare("SELECT data FROM pages WHERE slug=? AND status='published'").bind(slug).first<{ data: string }>();
    if (row && row.data) {
      const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      if (parsed) {
        pageData = {
          ...parsed,
          name: (!parsed.name || parsed.name === 'Untitled product' || parsed.name === 'Untitled') ? 'باك الراحة والشفاء الطبيعي' : parsed.name,
          images: Array.isArray(parsed.images) ? parsed.images : (parsed.image ? [parsed.image] : []),
          image: parsed.image || (Array.isArray(parsed.images) && parsed.images.length > 0 ? parsed.images[0] : '/assets/bundle.png'),
          reviewsImage: parsed.reviewsImage || ''
        };
      }
    }
  } catch {}

  try {
    brandData = await brand();
  } catch {}

  return <Storefront slug={slug} page={pageData} brand={brandData} />;
}
