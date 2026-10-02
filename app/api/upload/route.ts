import {admin,error,originCheck} from '@/lib/store';
import path from 'node:path';
import fs from 'node:fs';

export const dynamic = 'force-dynamic';

function getCloudflareBucket() {
  try {
    // @ts-ignore
    const { env } = require('cloudflare:workers');
    return env?.BUCKET || null;
  } catch {
    return null;
  }
}

export async function POST(r:Request){
  try{
    originCheck(r);
    await admin();
    const f=(await r.formData()).get('file');
    if(!(f instanceof File)||f.size>10*1024*1024||!['image/png','image/jpeg','image/webp'].includes(f.type)){
      return Response.json({error:'اختر صورة صيغتها PNG أو JPG أو WebP بحجم أقل من 10 ميغابايت.'},{status:400});
    }

    const ext = f.type==='image/jpeg'?'jpg':f.type.split('/')[1];
    const key = crypto.randomUUID()+'.'+ext;
    const arrayBuffer = await f.arrayBuffer();

    const bucket = getCloudflareBucket();
    if (bucket) {
      await bucket.put(key, arrayBuffer, {httpMetadata:{contentType:f.type}});
      return Response.json({url:'/assets/uploads/'+key});
    }

    // Node.js local storage fallback
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, key), Buffer.from(arrayBuffer));

      const distUploadsDir = path.join(process.cwd(), 'dist', 'client', 'uploads');
      if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
        if (!fs.existsSync(distUploadsDir)) fs.mkdirSync(distUploadsDir, { recursive: true });
        fs.writeFileSync(path.join(distUploadsDir, key), Buffer.from(arrayBuffer));
      }

      return Response.json({url:'/uploads/'+key});
    } catch (diskErr) {
      // Fallback: Base64 Data URL (100% Writable on Read-Only Serverless)
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return Response.json({url: `data:${f.type};base64,${base64}`});
    }
  }catch(e){
    return error(e)
  }
}
