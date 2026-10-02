import {admin,db,brand,defaultBrand,error,originCheck,safeImage} from '@/lib/store';
import {z} from 'zod';
export const dynamic='force-dynamic';
const reviewSchema=z.object({id:z.string().optional(),name:z.string().max(100),city:z.string().max(100),comment:z.string().max(1000),rating:z.number().min(1).max(5).default(5),date:z.string().max(50).optional()});
const pageSchema=z.object({
  id:z.string().min(1).max(100),
  name:z.string().trim().min(1).max(120),
  slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  price:z.number().min(1).max(1000000),
  comparePrice:z.number().min(0).max(1000000),
  shipping:z.number().min(0).max(10000),
  status:z.enum(['draft','published','archived']),
  template:z.enum(['editorial','minimal','bold']),
  language:z.enum(['en','ar','fr']),
  headline:z.string().trim().max(250).optional().default(''),
  description:z.string().max(2000).optional().default(''),
  image:z.string().max(10000000).optional().default(''),
  images:z.array(z.string().max(10000000)).optional().default([]),
  reviewsImage:z.string().max(10000000).optional().default(''),
  customHtml:z.string().max(10000000).optional().default(''),
  benefits:z.string().max(2000).optional().default(''),
  cta:z.string().min(1).max(100).default('اطلب الآن'),
  sections:z.array(z.object({title:z.string().max(150),text:z.string().max(2000),image:z.string().max(10000000)})).optional().default([]),
  faq:z.array(z.object({q:z.string().max(300),a:z.string().max(2000)})).optional().default([]),
  reviews:z.array(reviewSchema).optional().default([]),
  createdAt:z.string()
});

export async function GET(){
  try{
    const user=await admin();
    await db().prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('brand',?)").bind(JSON.stringify(defaultBrand)).run();
    const [pages,orders,visits,b]=await Promise.all([
      db().prepare('SELECT data FROM pages ORDER BY rowid DESC').all<{data:string}>(),
      db().prepare('SELECT * FROM orders ORDER BY created_at DESC').all(),
      db().prepare('SELECT page_id,day,count(*) AS count FROM visits GROUP BY page_id,day').all(),
      brand()
    ]);
    return Response.json({pages:pages.results.map(p=>JSON.parse(p.data)),orders:orders.results,visits:visits.results,brand:b,user:user.displayName},{headers:{'Cache-Control':'no-store'}});
  }catch(e){
    return error(e)
  }
}

export async function POST(r:Request){
  try{
    originCheck(r);
    await admin();
    const x:any=await r.json();
    if(x.action==='page'){
      const p=pageSchema.parse(x.page);
      await db().prepare('INSERT INTO pages(id,slug,status,data) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,status=excluded.status,data=excluded.data').bind(p.id,p.slug,p.status,JSON.stringify(p)).run();
      return Response.json({ok:true});
    }
    if(x.action==='brand'){
      const b=z.object({
        name:z.string().trim().min(1).max(60),
        tagline:z.string().max(120),
        color:z.string().regex(/^#[0-9a-fA-F]{6}$/),
        logo:z.string().max(10000000).refine(safeImage),
        phone:z.string().max(40),
        currency:z.literal('MAD')
      }).parse(x.brand);
      await db().prepare("UPDATE settings SET value=? WHERE key='brand'").bind(JSON.stringify(b)).run();
      return Response.json({ok:true});
    }
    if(x.action==='status'){
      const p=z.object({id:z.string(),status:z.enum(['new','confirmed','shipped','delivered','cancelled'])}).parse(x);
      const result=await db().prepare('UPDATE orders SET status=? WHERE id=?').bind(p.status,p.id).run();
      if(!result.meta.changes)throw new Error('Missing order');
      return Response.json({ok:true});
    }
    throw new Error('Invalid operation');
  }catch(e){
    return error(e)
  }
}
