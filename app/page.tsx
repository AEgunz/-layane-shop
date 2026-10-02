import Storefront from './storefront';
import { db } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let slug = '';
  try {
    const row = await db().prepare("SELECT slug FROM pages WHERE status='published' ORDER BY rowid ASC").first<{ slug: string }>();
    if (row && row.slug) {
      slug = row.slug;
    }
  } catch {}

  if (!slug) {
    // If no published page exists yet, render default storefront
    return <Storefront slug="default" />;
  }

  return <Storefront slug={slug} />;
}
