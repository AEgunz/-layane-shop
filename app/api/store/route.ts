import {admin,db,brand,defaultBrand,error,originCheck,safeImage,getAdmins,getSessionPermissions,getCurrentAdminInfo} from '@/lib/store';
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
  qtyOptions:z.array(z.object({
    qty:z.number().int().min(1).max(100),
    labelAr:z.string().max(100).default(''),
    labelEn:z.string().max(100).default(''),
    badgeAr:z.string().max(60).default(''),
    badgeEn:z.string().max(60).default(''),
    price:z.number().min(0).max(1000000).default(0),
    enabled:z.boolean().default(true)
  })).max(10).optional().default([]),
  createdAt:z.string()
});

export async function GET(){
  try{
    const user=await admin();
    try {
      await db().prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('brand',?)").bind(JSON.stringify(defaultBrand)).run();
    } catch {}

    let pages: any = { results: [] };
    let orders: any = { results: [] };
    let visits: any = { results: [] };
    let b = defaultBrand;
    let adminsList: any[] = [];
    let userPerms = ['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings'];
    let currentAdmin = { name: 'Primary Administrator', username: 'admin', role: 'full' };
    let mainHomePageId = '';

    try { pages = await db().prepare('SELECT data FROM pages ORDER BY rowid DESC').all(); } catch {}
    try { orders = await db().prepare('SELECT * FROM orders ORDER BY created_at DESC').all(); } catch {}
    try { visits = await db().prepare('SELECT page_id,day,count(*) AS count FROM visits GROUP BY page_id,day').all(); } catch {}
    try { b = await brand(); } catch {}
    try { adminsList = await getAdmins(); } catch {}
    try { userPerms = await getSessionPermissions(); } catch {}
    try { currentAdmin = await getCurrentAdminInfo(); } catch {}
    try {
      const mainSetting = await db().prepare("SELECT value FROM settings WHERE key='main_home_page_id'").first();
      if (mainSetting && mainSetting.value) mainHomePageId = mainSetting.value;
    } catch {}

    return Response.json({
      pages: (pages?.results || []).map((p: any) => {
        try { return typeof p.data === 'string' ? JSON.parse(p.data) : p.data; } catch { return null; }
      }).filter(Boolean),
      orders: orders?.results || [],
      visits: visits?.results || [],
      brand: b || defaultBrand,
      admins: adminsList,
      permissions: userPerms,
      currentAdmin,
      mainHomePageId,
      user: user.displayName
    },{headers:{'Cache-Control':'no-store'}});
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

    if(x.action==='set_main_home'){
      const {id} = z.object({id:z.string()}).parse(x);
      await db().prepare("DELETE FROM settings WHERE key=?").bind('main_home_page_id').run();
      await db().prepare("INSERT INTO settings(key,value) VALUES(?,?)").bind('main_home_page_id', id).run();
      return Response.json({ok:true});
    }

    if(x.action==='delete_page'){
      const {id} = z.object({id:z.string()}).parse(x);
      await db().prepare("DELETE FROM pages WHERE id=?").bind(id).run();
      return Response.json({ok:true});
    }

    if(x.action==='brand'){
      const b=z.object({
        name:z.string().trim().min(1).max(60),
        tagline:z.string().max(120),
        color:z.string().regex(/^#[0-9a-fA-F]{6}$/),
        logo:z.string().max(10000000).refine(safeImage),
        phone:z.string().max(40),
        pixelId:z.string().max(100).optional().default('1116296790985534'),
        currency:z.literal('MAD')
      }).parse(x.brand);
      await db().prepare("DELETE FROM settings WHERE key=?").bind('brand').run();
      await db().prepare("INSERT INTO settings(key,value) VALUES(?,?)").bind('brand', JSON.stringify(b)).run();
      return Response.json({ok:true});
    }

    if(x.action==='add_admin'){
      const newAdmin=z.object({
        id:z.string().default(()=>crypto.randomUUID()),
        name:z.string().trim().min(2).max(100),
        username:z.string().trim().min(3).max(60),
        password:z.string().trim().min(4).max(100),
        role:z.enum(['full', 'orders_only', 'pages_only', 'custom']).default('full'),
        permissions:z.array(z.string()).default(['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings'])
      }).parse(x.admin);

      const currentAdmins = await getAdmins();
      if (currentAdmins.some((a: any) => a.username.toLowerCase() === newAdmin.username.toLowerCase())) {
        throw new Error('اسم المستخدم مستعمل بالفعل. اختر اسم مستخدم آخر.');
      }

      const updatedAdmins = [...currentAdmins, newAdmin];
      await db().prepare("DELETE FROM settings WHERE key=?").bind('admins').run();
      await db().prepare("INSERT INTO settings(key,value) VALUES(?,?)").bind('admins', JSON.stringify(updatedAdmins)).run();
      return Response.json({ok:true});
    }

    if(x.action==='delete_admin'){
      const {id} = z.object({id:z.string()}).parse(x);
      const currentAdmins = await getAdmins();
      const updatedAdmins = currentAdmins.filter((a: any) => a.id !== id);
      await db().prepare("DELETE FROM settings WHERE key=?").bind('admins').run();
      await db().prepare("INSERT INTO settings(key,value) VALUES(?,?)").bind('admins', JSON.stringify(updatedAdmins)).run();
      return Response.json({ok:true});
    }

    if(x.action==='delete_order'){
      const {id} = z.object({id:z.string()}).parse(x);
      await db().prepare("DELETE FROM orders WHERE id=?").bind(id).run();
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
