const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function load(file,deps={}) {
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 {exports,require:n=>deps[n]??require(n),Buffer,TextEncoder,URL,Response,crypto:require('node:crypto').webcrypto});
 return exports;
}
test('inline images become small URLs without changing saved data; image bytes round-trip',async()=>{
 const images=load('lib/product-images.ts');
 const bytes=Buffer.alloc(1024*1024,123);
 const source='data:image/png;base64,'+bytes.toString('base64');
 const saved={image:source,images:[source],customHtml:`<img src="${source}">`,price:199};
 const result=await images.prepareProductImages(saved,'selected');
 assert.equal(saved.image,source);
 assert.ok(JSON.stringify(result.data).length<1000);
 assert.equal(result.data.image,result.data.images[0]);
 assert.ok(!JSON.stringify(result.data).includes('data:image/'));
 const route=load('app/api/product-image/route.ts',{'@/lib/product-images':images,'@/lib/store':{db:()=>{throw Error('warm image should not query database')}}});
 const response=await route.GET(new Request('https://shop.example'+result.data.image));
 assert.equal(response.status,200);
 assert.equal(response.headers.get('content-type'),'image/png');
 assert.match(response.headers.get('cache-control'),/immutable/);
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
});
test('cold instance reconstructs image from published data; invalid hashes and missing pages cannot return it',async()=>{
 const saved={image:'data:image/webp;base64,'+Buffer.from('sample-image').toString('base64')};
 const first=load('lib/product-images.ts');
 const url=(await first.prepareProductImages(saved,'selected')).data.image;
 const cold=load('lib/product-images.ts');
 let queries=0;
 const db=()=>({prepare(sql){assert.match(sql,/status='published'/);return{bind(id){assert.equal(id,'selected');return{async first(){queries++;return{data:JSON.stringify(saved)}}}}}}});
 const route=load('app/api/product-image/route.ts',{'@/lib/product-images':cold,'@/lib/store':{db}});
 assert.equal((await route.GET(new Request('https://shop.example'+url))).status,200);
 assert.equal(queries,1);
 assert.equal((await route.GET(new Request('https://shop.example/api/product-image?page=selected&image=bad'))).status,400);
 assert.equal((await route.GET(new Request('https://shop.example/api/product-image?page=selected&image='+'0'.repeat(64)))).status,404);
 const missing=load('app/api/product-image/route.ts',{'@/lib/product-images':load('lib/product-images.ts'),'@/lib/store':{db:()=>({prepare:()=>({bind:()=>({first:async()=>null})})})}});
 assert.equal((await missing.GET(new Request('https://shop.example'+url))).status,404);
});
