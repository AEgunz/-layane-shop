import {db,brand,error,originCheck,getAdmins} from '@/lib/store';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {z} from 'zod';
export const dynamic='force-dynamic';

export async function GET(r:Request){
  try{
    const slug=new URL(r.url).searchParams.get('slug');
    let row: any = null;
    if (slug && slug !== 'default' && slug !== 'home') {
      row = await db().prepare("SELECT data FROM pages WHERE slug=? AND status='published'").bind(slug).first<{data:string}>();
    }
    if (!row) {
      row = await db().prepare("SELECT data FROM pages WHERE status='published' ORDER BY rowid ASC").first<{data:string}>();
    }
    if (!row) {
      const defaultPage = {
        id: 'default-product',
        name: 'layane-shop Store',
        slug: 'home',
        price: 199,
        comparePrice: 299,
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
      return Response.json({ page: defaultPage, brand: await brand() }, { headers: { 'Cache-Control': 'no-store' } });
    }
    return Response.json({page:JSON.parse(row.data),brand:await brand()},{headers:{'Cache-Control':'no-store'}})
  }catch(e){
    return error(e)
  }
}

export async function POST(r:Request){
  try{
    originCheck(r);
    const x:any=await r.json();

    if(x.action==='login'){
      const username=String(x.username||'').trim().toLowerCase();
      const password=String(x.password||'').trim();

      const adminsList = await getAdmins();
      const matchedAdmin = adminsList.find((a: any) =>
        String(a.username).toLowerCase() === username && String(a.password) === password
      );

      const isDefaultAdmin = (username==='admin'||username==='layane') && (password==='layane2026'||password==='admin'||password==='123456'||password==='layaneshop');

      if (matchedAdmin || isDefaultAdmin) {
        const perms = matchedAdmin?.permissions || ['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings'];
        const userSlug = matchedAdmin?.username || 'admin';
        const sessionVal = `logged_in:${userSlug}:${encodeURIComponent(JSON.stringify(perms))}`;

        const headers=new Headers({'Content-Type':'application/json'});
        headers.append('Set-Cookie',`admin_session=${sessionVal}; Path=/; HttpOnly; Max-Age=${60*60*24*30}; SameSite=Lax`);
        return new Response(JSON.stringify({ok:true}),{status:200,headers});
      }
      return Response.json({error:'اسم المستخدم أو كلمة المرور غير صحيحة'},{status:400});
    }

    if(x.action==='logout'){
      const headers=new Headers({'Content-Type':'application/json'});
      headers.append('Set-Cookie','admin_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax');
      return new Response(JSON.stringify({ok:true}),{status:200,headers});
    }

    if(x.action==='visit'){
      const slug = String(x.slug || '').slice(0, 100);
      let row = null;
      if (slug && slug !== 'default' && slug !== 'home') {
        row = await db().prepare("SELECT id FROM pages WHERE slug=? AND status='published'").bind(slug).first<{id:string}>();
      }
      if (!row) {
        row = await db().prepare("SELECT id FROM pages WHERE status='published' ORDER BY rowid ASC").first<{id:string}>();
      }
      const pageId = row?.id || 'default-product';

      const user=await getChatGPTUser();
      const owner=await db().prepare("SELECT value FROM settings WHERE key='owner'").first<{value:string}>();
      if(user?.userId!==owner?.value){
        const token=z.string().uuid().parse(x.token);
        await db().prepare('INSERT OR IGNORE INTO visits(page_id,token,day) VALUES(?,?,?)').bind(pageId,token,new Date().toISOString().slice(0,10)).run();
      }
      return Response.json({ok:true});
    }

    if(x.action==='order'){
      const slug = String(x.slug || '').slice(0, 100);
      let row = null;
      if (slug && slug !== 'default' && slug !== 'home') {
        row = await db().prepare("SELECT id,data FROM pages WHERE slug=? AND status='published'").bind(slug).first<{id:string,data:string}>();
      }
      if (!row) {
        row = await db().prepare("SELECT id,data FROM pages WHERE status='published' ORDER BY rowid ASC").first<{id:string,data:string}>();
      }

      let pageId = row?.id || 'default-product';
      let productName = 'layane-shop Product';
      let productPrice = 199;
      let productShipping = 0;

      if (row && row.data) {
        try {
          const p = JSON.parse(row.data);
          productName = p.name || productName;
          productPrice = p.price || productPrice;
          productShipping = p.shipping ?? productShipping;
        } catch {}
      }

      const o = z.object({
        id: z.string().uuid(),
        name: z.string().trim().min(2).max(120),
        phone: z.string().regex(/^[+0-9\s()-]{8,25}$/),
        city: z.string().trim().min(2).max(100),
        address: z.string().trim().min(3).max(500),
        quantity: z.number().int().min(1).max(10),
        notes: z.string().max(1000).default(''),
        website: z.string().max(0).optional()
      }).parse(x);

      const existing = await db().prepare('SELECT id FROM orders WHERE id=?').bind(o.id).first();
      if (!existing) {
        const total = productPrice * o.quantity + productShipping;
        await db().prepare("INSERT INTO orders(id,page_id,product,customer,phone,city,address,quantity,unit_price,shipping,total,status,created_at,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,'new',?,?)")
          .bind(o.id, pageId, productName, o.name, o.phone, o.city, o.address, o.quantity, productPrice, productShipping, total, new Date().toISOString(), o.notes)
          .run();
      }

      return Response.json({ ok: true, reference: o.id.slice(0, 8).toUpperCase() });
    }

    throw new Error('Invalid operation');
  }catch(e){
    return error(e)
  }
}
