import { admin, db, error, originCheck } from '@/lib/store';
import { externalizeDataImages } from '@/lib/externalize-images';

export const dynamic = 'force-dynamic';

/**
 * One-shot migration (mobile performance fix).
 *
 * Product images uploaded on read-only serverless were stored as Base64
 * data: URLs inside the page JSON → ~5 MB of base64 inlined into the HTML
 * of every page render (FCP/LCP ~20 s on mobile).
 *
 * Open this URL once while logged in as admin (GET works in the browser):
 * it extracts every Base64 image into a real file (R2 bucket or local disk,
 * both served with immutable cache headers), rewrites the page data with
 * file URLs and persists it back. Idempotent: safe to run multiple times.
 *
 * Returns a JSON report, including per-page errors, so a failure here can
 * never take the storefront down.
 */
async function migrate() {
  const report: any = { ok: true, pages: [] };

  const res = await db().prepare("SELECT id, slug, data FROM pages WHERE status='published'").all();
  const rows = res?.results || [];

  for (const row of rows) {
    const entry: any = { id: row.id, slug: row.slug, changed: false, images: 0 };
    try {
      const parsed = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      if (!parsed || typeof parsed !== 'object') {
        entry.skipped = 'no data';
        report.pages.push(entry);
        continue;
      }

      const before = JSON.stringify(parsed).match(/data:image\//g)?.length || 0;
      const { data: migrated, changed } = await externalizeDataImages(parsed);
      const after = JSON.stringify(migrated).match(/data:image\//g)?.length || 0;

      entry.images = before - after;
      entry.remainingBase64 = after;

      if (changed) {
        await db()
          .prepare('INSERT INTO pages(id,slug,status,data) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,status=excluded.status,data=excluded.data')
          .bind(row.id, row.slug || migrated.slug || '', 'published', JSON.stringify(migrated))
          .run();
        entry.changed = true;
      }
    } catch (e: any) {
      entry.error = String(e?.message || e);
      report.ok = false;
    }
    report.pages.push(entry);
  }

  return report;
}

export async function GET(r: Request) {
  try {
    originCheck(r);
    await admin();
    return Response.json(await migrate());
  } catch (e) {
    return error(e);
  }
}

export async function POST(r: Request) {
  try {
    originCheck(r);
    await admin();
    return Response.json(await migrate());
  } catch (e) {
    return error(e);
  }
}
