'use client';
import {useState,useEffect,useCallback} from 'react';
import {LayoutDashboard,PanelsTopLeft,ShoppingBag,ChartNoAxesCombined,Settings,Plus,Leaf,ArrowUpRight,Globe,MousePointer2,Wallet,Search,ChevronDown,Download,ExternalLink,Copy,Pencil,X,Monitor,Smartphone,Check,Archive,RefreshCw,ImagePlus,ArrowLeft,ArrowRight,Eye,ShieldCheck,Upload,LogOut} from 'lucide-react';
import {Logo,ProductView} from './storefront';
import JSZip from 'jszip';

const money=(n:number)=>new Intl.NumberFormat('en-MA',{maximumFractionDigits:2}).format(n)+' DH';
const niceDate=(s:string)=>new Date(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Casablanca'});
const navs:any[]=[[LayoutDashboard,'Overview'],[PanelsTopLeft,'Landing pages'],[ShoppingBag,'Orders'],[ChartNoAxesCombined,'Analytics'],[Settings,'Brand settings']];
async function api(body?:any){const r=await fetch('/api/store',body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);const d:any=await r.json();if(!r.ok)throw new Error(d.error);return d}
function Badge({status}:any){return <span className={'pill '+status}>{status}</span>}
function compressImage(file:File):Promise<File>{return new Promise((resolve)=>{if(file.size<=1.5*1024*1024||!file.type.startsWith('image/'))return resolve(file);const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);const canvas=document.createElement('canvas');let{width,height}=img;const maxDim=1920;if(width>maxDim||height>maxDim){if(width>height){height=Math.round((height*maxDim)/width);width=maxDim}else{width=Math.round((width*maxDim)/height);height=maxDim}}canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)return resolve(file);ctx.drawImage(img,0,0,width,height);canvas.toBlob((blob)=>{if(!blob)return resolve(file);resolve(new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'}))},'image/jpeg',0.82)};img.onerror=()=>resolve(file);img.src=url})}
function Empty({icon:Icon=ShoppingBag,title,text,action}:any){return <div className="empty"><span><Icon size={28}/></span><h3>{title}</h3><p>{text}</p>{action}</div>}

function ImageField({value,onChange,label='صورة البانر الرئيسية'}:any){const [busy,setBusy]=useState(false);const [error,setError]=useState('');async function upload(e:any){const file=e.target.files?.[0];if(!file)return;setBusy(true);setError('');try{const fileToUpload=await compressImage(file);const body=new FormData();body.append('file',fileToUpload);const r=await fetch('/api/upload',{method:'POST',body});const resText=await r.text();let d:any;try{d=JSON.parse(resText)}catch{if(r.status===413)throw new Error('حجم الصورة كبير جداً. يرجى اختيار صورة بحجم أصغر.');throw new Error(resText||'فشل رفع الصورة.')}if(!r.ok)throw new Error(d.error||'Unable to upload image');onChange(d.url)}catch(e:any){setError(e.message)}finally{setBusy(false)}}return <div className="imagefield"><label>{label}<input value={value} placeholder="https://… or upload an image" onChange={e=>onChange(e.target.value)}/></label><div>{value&&<img src={value} alt={label}/>}<label className="upload"><ImagePlus size={16}/>{busy?'Uploading…':'Upload image'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={busy}/></label>{value&&<button type="button" className="textbutton" onClick={()=>onChange('')}>Remove</button>}</div>{error&&<p className="error">{error}</p>}</div>}

function ZipUploader({onHtmlLoaded,onImagesLoaded}:any){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [status,setStatus]=useState('');

  async function handleZip(e:any){
    const file=e.target.files?.[0];
    if(!file)return;
    setBusy(true);
    setError('');
    setStatus('جار قراءة واستخراج ملف ZIP...');
    try{
      if(file.name.endsWith('.html')||file.name.endsWith('.htm')){
        const text=await file.text();
        onHtmlLoaded(text);
        setStatus('تم تحميل صفحة HTML بنجاح!');
        return;
      }
      if(!file.name.endsWith('.zip')){
        throw new Error('يرجى اختيار ملف صيغته .zip أو .html');
      }
      const zip=new JSZip();
      const zipContents=await zip.loadAsync(file);
      const htmlFile=zipContents.file('index.html')||Object.values(zipContents.files).find(f=>f.name.endsWith('.html')||f.name.endsWith('.htm'));
      let htmlText='';
      if(htmlFile){
        htmlText=await htmlFile.async('text');
      }
      const imageEntries=Object.entries(zipContents.files).filter(([name,f])=>!f.dir&&/\.(png|jpe?g|webp|svg|gif)$/i.test(name));
      setStatus(`تم العثور على ${imageEntries.length} صورة داخل الملف... جار رفع الصور...`);
      const uploadedImages:string[]=[];
      for(let i=0;i<imageEntries.length;i++){
        const [relativePath,entry]=imageEntries[i];
        const blob=await entry.async('blob');
        const imgFile=new File([blob],relativePath.split('/').pop()||`img_${i}.jpg`,{type:blob.type||'image/jpeg'});
        try{
          const fileToUpload=await compressImage(imgFile);
          const body=new FormData();
          body.append('file',fileToUpload);
          const r=await fetch('/api/upload',{method:'POST',body});
          const d=await r.json();
          if(r.ok&&d.url){
            uploadedImages.push(d.url);
            if(htmlText){
              const filename=relativePath.split('/').pop();
              if(filename){
                htmlText=htmlText.replaceAll(relativePath,d.url).replaceAll(filename,d.url);
              }
            }
          }
        }catch(err){console.error(err)}
      }
      if(htmlText){
        onHtmlLoaded(htmlText);
        setStatus('تم رفع وتفعيل صفحة HTML بنجاح!');
      }else if(uploadedImages.length>0){
        onImagesLoaded(uploadedImages);
        setStatus(`تم استخراج ورفع ${uploadedImages.length} صورة لصفحة الهبوط!`);
      }else{
        throw new Error('لم يتم العثور على ملفات HTML أو صور داخل ملف ZIP.');
      }
    }catch(e:any){
      setError(e.message||'حدث خطأ أثناء فك الملف');
    }finally{
      setBusy(false);
    }
  }

  return (
    <div className="zip-uploader-box" style={{marginBottom:'20px'}}>
      <label className="upload primary-upload" style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'12px 18px',background:'#205b44',color:'#fff',borderRadius:'8px',cursor:'pointer',fontWeight:'600'}}>
        <Upload size={18}/>
        {busy?status||'جار معالجة الملف...':'رفع ملف ZIP أو HTML المباشر (Landing Page ZIP File)'}
        <input type="file" accept=".zip,.html,.htm" onChange={handleZip} disabled={busy} style={{display:'none'}}/>
      </label>
      {status&&!error&&<p style={{fontSize:'12px',color:'#205b44',marginTop:'8px',fontWeight:'600'}}>{status}</p>}
      {error&&<p className="error" style={{marginTop:'8px'}}>{error}</p>}
    </div>
  );
}

function MultiImageUploader({images,onChange}:any){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  function move(from:number,to:number){
    if(to<0||to>=(images||[]).length)return;
    const list=[...(images||[])];
    const [item]=list.splice(from,1);
    list.splice(to,0,item);
    onChange(list);
  }

  async function handleFiles(e:any){
    const files:FileList=e.target.files;
    if(!files||files.length===0)return;
    setBusy(true);
    setError('');
    const newUrls:string[]=[...(images||[])];
    try{
      for(let i=0;i<files.length;i++){
        const fileToUpload=await compressImage(files[i]);
        const body=new FormData();
        body.append('file',fileToUpload);
        const r=await fetch('/api/upload',{method:'POST',body});
        const resText=await r.text();
        let d:any;
        try{d=JSON.parse(resText)}catch{throw new Error('فشل رفع الصورة')}
        if(!r.ok)throw new Error(d.error||'فشل الرفع');
        newUrls.push(d.url);
      }
      onChange(newUrls);
    }catch(err:any){
      setError(err.message);
    }finally{
      setBusy(false);
    }
  }

  return (
    <div className="multi-image-uploader" style={{marginBottom:'20px'}}>
      <label className="upload" style={{display:'inline-flex',alignItems:'center',gap:'8px',padding:'10px 15px',border:'1px solid #dce4db',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'600'}}>
        <ImagePlus size={16}/>
        {busy?'جار رفع الصور...':'رفع عدة صور متتالية لصفحة الهبوط (Multiple Images)'}
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleFiles} disabled={busy} style={{display:'none'}}/>
      </label>
      {images&&images.length>0&&(
        <div className="image-preview-list" style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'14px'}}>
          {images.map((url:string,idx:number)=>(
            <div key={idx} style={{position:'relative',width:'105px',border:'1px solid #dce4db',borderRadius:'8px',overflow:'hidden',background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <span style={{position:'absolute',top:'4px',left:'4px',background:'rgba(0,0,0,0.7)',color:'#fff',padding:'2px 6px',borderRadius:'4px',fontSize:'10px',fontWeight:'700',zIndex:2}}>
                #{idx+1}
              </span>
              <img src={url} alt={`Section ${idx+1}`} style={{width:'100%',height:'90px',objectFit:'cover',display:'block'}}/>
              <div style={{display:'flex',justify:'space-between',alignItems:'center',background:'#f4f7f3',padding:'5px 6px',borderTop:'1px solid #e1e9df'}}>
                <button type="button" title="تحريك لليسار" disabled={idx===0} onClick={()=>move(idx,idx-1)} style={{padding:'3px 6px',border:0,background:'transparent',cursor:'pointer',opacity:idx===0?0.3:1}}>
                  <ArrowLeft size={14}/>
                </button>
                <button type="button" title="تحريك لليمين" disabled={idx===images.length-1} onClick={()=>move(idx,idx+1)} style={{padding:'3px 6px',border:0,background:'transparent',cursor:'pointer',opacity:idx===images.length-1?0.3:1}}>
                  <ArrowRight size={14}/>
                </button>
                <button type="button" title="حذف" onClick={()=>onChange(images.filter((_:any,i:number)=>i!==idx))} style={{padding:'3px 6px',border:0,background:'transparent',color:'#d32f2f',cursor:'pointer'}}>
                  <X size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error&&<p className="error" style={{marginTop:'8px'}}>{error}</p>}
    </div>
  );
}

export default function Studio(){
  const [tab,setTab]=useState('Overview');
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState('');
  const [toast,setToast]=useState('');
  const [busy,setBusy]=useState(false);
  const [range,setRange]=useState('30');
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('all');
  const [editor,setEditor]=useState<any>(null);
  const [detail,setDetail]=useState<any>(null);
  const [branding,setBranding]=useState<any>(null);
  const [mobile,setMobile]=useState(false);

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');

  const reload=useCallback(async()=>{
    try{
      const d=await api();
      setData(d);
      setError('');
      setLoginErr('');
      return d;
    }catch(e:any){
      setError(e.message);
    }
  },[]);

  useEffect(()=>{reload()},[reload]);
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(t)}},[toast]);
  useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setDetail(null)}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);

  async function handleLogin(e:any){
    e.preventDefault();
    setBusy(true);
    setLoginErr('');
    try {
      const res = await fetch('/api/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', username, password })
      });
      const resText = await res.text();
      let d: any = {};
      try { d = JSON.parse(resText); } catch { throw new Error(resText || 'خطأ في الاتصال بالخادم'); }
      if (!res.ok) throw new Error(d.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      await reload();
    } catch(err:any){
      setLoginErr(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout(){
    try {
      await fetch('/api/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
      setData(null);
      setError('AUTH');
    } catch {}
  }

  function navigate(t:string){if(branding&&!window.confirm('Leave brand settings? Unsaved changes will be lost.'))return;if(editor&&!window.confirm('Leave the editor? Unsaved changes will be lost.'))return;setEditor(null);setTab(t);setQuery('');setFilter('all');setBranding(null)}
  async function save(body:any,message:string){setBusy(true);setError('');try{await api(body);const d=await reload();setToast(message);return d}catch(e:any){setError(e.message);return null}finally{setBusy(false)}}
  async function savePage(status?:string){const p={...editor,status:status||editor.status};const result=await save({action:'page',page:p},p.status==='published'?'Page published. Your storefront is ready.':'Page saved.');if(result)setEditor(p)}
  async function duplicate(p:any){const id=crypto.randomUUID();const cp={...p,id,slug:p.slug+'-'+id.slice(0,5),name:p.name+' (copy)',status:'draft',createdAt:new Date().toISOString()};const result=await save({action:'page',page:cp},'Page duplicated as a draft.');if(result){setEditor(cp)}}
  function newPage(){const id=crypto.randomUUID();setEditor({id,name:'Untitled product',slug:'product-'+id.slice(0,8),price:199,comparePrice:0,shipping:0,status:'draft',template:'editorial',language:'ar',headline:'',description:'',image:'',images:[],reviewsImage:'',customHtml:'',benefits:'',cta:'اطلب الآن',sections:[],faq:[],createdAt:new Date().toISOString()});setTab('Landing pages')}
  function exportOrders(rows:any[]){const fields=['id','customer','phone','city','address','product','quantity','unit_price','shipping','total','status','created_at','notes'];const cell=(x:any)=>'"'+String(x??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';const csv='\uFEFF'+[fields.join(','),...rows.map(o=>fields.map(k=>cell(o[k])).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='layane-shop-orders.csv';a.click();URL.revokeObjectURL(url)}

  if (!data) {
    return (
      <div className="login-backdrop">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-head">
            <Leaf size={38} style={{ color: '#205b44', margin: '0 auto 10px auto' }} />
            <h2>layane-shop Store Studio</h2>
            <p>تسجيل الدخول إلى لوحة تحكم المتجر</p>
          </div>
          {loginErr && <p className="error" style={{ color: '#d32f2f', background: '#fdeded', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', textAlign: 'center' }}>{loginErr}</p>}
          <label>
            اسم المستخدم (Username)
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              dir="ltr"
            />
          </label>
          <label>
            كلمة المرور (Password)
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              dir="ltr"
            />
          </label>
          <button type="submit" className="storebutton" disabled={busy} style={{ width: '100%', marginTop: '10px' }}>
            {busy ? 'جار التحقق…' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    );
  }

  const b=data.brand;const pages=data.pages;const allOrders=data.orders;const since=range==='all'?'':new Date(Date.now()-Number(range)*86400000).toISOString();const orders=allOrders.filter((o:any)=>!since||o.created_at>=since);const visits=data.visits.filter((v:any)=>!since||v.day>=since.slice(0,10));const visitCount=visits.reduce((n:number,v:any)=>n+v.count,0);const activeOrders=orders.filter((o:any)=>o.status!=='cancelled');const sales=orders.filter((o:any)=>o.status==='delivered').reduce((n:number,o:any)=>n+o.total,0);const conversion=visitCount?(orders.length/visitCount*100).toFixed(1):'0';const newOrders=allOrders.filter((o:any)=>o.status==='new').length;
  const visiblePages=pages.filter((p:any)=>(filter==='all'||p.status===filter)&&p.name.toLowerCase().includes(query.toLowerCase()));const visibleOrders=orders.filter((o:any)=>(filter==='all'||o.status===filter)&&[o.customer,o.phone,o.product,o.id].some((v:string)=>v.toLowerCase().includes(query.toLowerCase())));const dateControl=<select className="datefilter" aria-label="Date range" value={range} onChange={e=>setRange(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option></select>;
  const performance=<div className="tablewrap"><table><thead><tr><th>Product</th><th>Visits</th><th>Orders</th><th>Conversion</th><th>Sales</th></tr></thead><tbody>{pages.filter((p:any)=>p.status!=='archived').map((p:any)=>{const v=visits.filter((x:any)=>x.page_id===p.id).reduce((n:number,x:any)=>n+x.count,0);const o=orders.filter((x:any)=>x.page_id===p.id);return <tr key={p.id}><td><div className="tableproduct">{p.image?<img src={p.image} alt=""/>:<span className="productplaceholder"><ShoppingBag size={18}/></span>}<span>{p.name}<small>/p/{p.slug}</small></span></div></td><td>{v.toLocaleString()}</td><td>{o.length}</td><td>{v?(o.length/v*100).toFixed(1):0}%</td><td className="strong">{money(o.filter((x:any)=>x.status==='delivered').reduce((n:number,x:any)=>n+x.total,0))}</td></tr>})}</tbody></table></div>;
  const orderTable=(rows:any[])=>rows.length?<div className="tablewrap"><table><thead><tr><th>Order / customer</th><th>Product</th><th>Total</th><th>Status</th><th>Date</th><th/></tr></thead><tbody>{rows.map((o:any)=><tr key={o.id}><td><button className="tablelink" onClick={()=>setDetail(o)}>{o.customer}</button><small>#{o.id.slice(0,8).toUpperCase()} · {o.phone}</small></td><td>{o.product}<small>{o.quantity} item{o.quantity>1?'s':''} · {o.city}</small></td><td className="strong">{money(o.total)}</td><td><Badge status={o.status}/></td><td>{niceDate(o.created_at)}</td><td><button className="iconbutton" title="Order details" onClick={()=>setDetail(o)}><ArrowUpRight size={16}/></button></td></tr>)}</tbody></table></div>:<Empty title={query||filter!=='all'?'No matching orders':'Your next order starts here'} text={query||filter!=='all'?'Try another search or status.':'Orders from all your landing pages will appear here.'} action={!query&&filter==='all'&&<button onClick={()=>navigate('Landing pages')}>Manage landing pages</button>}/>;
  const metrics=<div className="stats">{[[Wallet,'Total sales',money(sales),'Delivered orders only'],[ShoppingBag,'Total orders',orders.length.toLocaleString(),`${newOrders} awaiting confirmation`],[MousePointer2,'Page visits',visitCount.toLocaleString(),'Unique page sessions per day'],[ChartNoAxesCombined,'Conversion rate',conversion+'%','Orders ÷ page visits']].map(([Icon,label,value,hint]:any)=><div className="stat" key={label}><div><span>{label}</span><span className="statIcon"><Icon size={18}/></span></div><strong>{value}</strong><small>{hint}</small></div>)}</div>;
  return <div className="studio" style={{'--brand':b.color} as any}><aside><Logo brand={{...b,tagline:'STORE STUDIO'}}/><div className="workspace"><span className="workspaceicon">{b.name[0].toUpperCase()}</span><div>{b.name} store<small>Your workspace</small></div><ChevronDown size={15}/></div><div className="navlabel">WORKSPACE</div><nav>{navs.map(([Icon,label])=><button key={label} className={tab===label?'selected':''} onClick={()=>navigate(label)}><Icon size={19}/>{label}{label==='Orders'&&newOrders>0&&<span className="navcount">{newOrders}</span>}</button>)}</nav><div className="sidebottom"><div className="brandnote"><Globe size={21}/><strong>One brand. Every page.</strong><p>Your storefronts, connected.</p><button className="textbutton" onClick={()=>navigate('Brand settings')}>Manage your brand<ArrowUpRight size={14}/></button></div><div className="account" style={{justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:'8px'}}><div className="avatar">{b.name[0].toUpperCase()}</div><div>Store administrator<small>{b.name}</small></div></div><button type="button" onClick={handleLogout} title="تسجيل الخروج" style={{border:0,background:'transparent',cursor:'pointer',color:'#839487'}}><LogOut size={17}/></button></div></div></aside><main><header><span>Workspace <span className="slash">/</span><strong>{tab}</strong></span><div className="headerend"><span className="livebadge"><span/>Your store workspace</span><button className="iconbutton" title="Refresh store data" onClick={reload}><RefreshCw size={17}/></button><div className="avatar">{b.name[0].toUpperCase()}</div></div></header>{error&&<div className="error banner" role="alert">{error}<button onClick={()=>setError('')} aria-label="Dismiss error"><X size={16}/></button></div>}{toast&&<div className="toast" role="status"><Check size={18}/>{toast}</div>}
  {editor?<div className="editor"><div className="edithead"><div><button className="iconbutton" onClick={()=>{if(window.confirm('Leave the editor? Make sure your changes are saved.'))setEditor(null)}} aria-label="Back to pages"><ArrowLeft size={20}/></button><div><h2>{editor.name}</h2><small>/p/{editor.slug} <Badge status={editor.status}/></small></div></div><div><button disabled={busy} onClick={()=>savePage()}>Save changes</button><button className="primary" disabled={busy} onClick={()=>savePage(editor.status==='published'?'draft':'published')}>{editor.status==='published'?'Unpublish':'Publish page'}</button></div></div><div className="editorbody"><div className="editfields"><form id="page-editor" onSubmit={e=>{e.preventDefault();savePage()}}><div className="fieldsection"><h3>رفع وترتيب صفحة الهبوط (Landing Page Upload & Reorder)</h3>
  <ZipUploader onHtmlLoaded={(customHtml:string)=>setEditor({...editor,customHtml})} onImagesLoaded={(images:string[])=>setEditor({...editor,images})}/>
  <MultiImageUploader images={editor.images||[]} onChange={(images:string[])=>setEditor({...editor,images})}/>
  <ImageField value={editor.image||''} onChange={(image:string)=>setEditor({...editor,image})} label="صورة البانر الرئيسية (Single Banner Image)"/>
  <ImageField value={editor.reviewsImage||''} onChange={(reviewsImage:string)=>setEditor({...editor,reviewsImage})} label="صورة آراء وتقييمات الزبناء (Customer Reviews Image)"/>
  <label>اسم المنتج (Product Name)<input dir="auto" required maxLength={120} value={editor.name} onChange={e=>setEditor({...editor,name:e.target.value})}/></label><label>رابط الصفحة (Page URL Slug)<input pattern="[a-z0-9]+(-[a-z0-9]+)*" required value={editor.slug} onChange={e=>setEditor({...editor,slug:e.target.value.toLowerCase().replaceAll(' ','-')})}/><small>/p/{editor.slug}</small></label><div className="formgrid"><label>السعر (Price DH)<input type="number" min="1" step="0.01" value={editor.price} onChange={e=>setEditor({...editor,price:+e.target.value})}/></label><label>السعر قبل التخفيض (DH)<input type="number" min="0" step="0.01" value={editor.comparePrice} onChange={e=>setEditor({...editor,comparePrice:+e.target.value})}/></label></div><div className="formgrid"><label>مصاريف التوصيل (DH)<input type="number" min="0" step="0.01" value={editor.shipping} onChange={e=>setEditor({...editor,shipping:+e.target.value})}/><small>0 = توصيل مجاني</small></label><label>نص زر الطلب<input dir="auto" value={editor.cta||'اطلب الآن'} onChange={e=>setEditor({...editor,cta:e.target.value})}/></label></div><label>لغة الصفحة<select value={editor.language||'ar'} onChange={e=>setEditor({...editor,language:e.target.value})}><option value="ar">العربية (right to left)</option><option value="en">English</option><option value="fr">Français</option></select></label></div></form></div><div className="previewarea"><div className="previewbar"><span><Eye size={15}/>Live preview</span><div><button aria-label="Desktop preview" className={!mobile?'active':''} onClick={()=>setMobile(false)}><Monitor size={17}/></button><button aria-label="Mobile preview" className={mobile?'active':''} onClick={()=>setMobile(true)}><Smartphone size={17}/></button></div><span>Unsaved changes shown</span></div><div className={'previewframe '+(mobile?'mobile':'')}><ProductView key={editor.id} page={editor} brand={b} preview/></div></div></div></div>:<div className="content"><div className="pagetitle"><div><div className="eyebrow">{tab==='Overview'?'YOUR BUSINESS, AT A GLANCE':tab==='Landing pages'?'YOUR PRODUCTS, THEIR OWN SPOTLIGHT':tab==='Orders'?'EVERY ORDER, ONE PLACE':tab==='Analytics'?'UNDERSTAND WHAT WORKS':'ONE IDENTITY, EVERYWHERE'}</div><h1>{tab==='Overview'?'Store overview':tab}</h1><p>{tab==='Overview'?'Every product. Every order. One place.':tab==='Landing pages'?'Create, customize, and grow your product storefronts.':tab==='Orders'?'From first click to doorstep. Keep every order moving.':tab==='Analytics'?'See how your pages turn visitors into customers.':'Keep every storefront unmistakably yours.'}</p></div>{tab==='Landing pages'||tab==='Overview'?<button className="primary" onClick={()=>newPage()}><Plus size={18}/>Create landing page</button>:tab==='Orders'?<button onClick={()=>exportOrders(visibleOrders)} disabled={!visibleOrders.length}><Download size={17}/>Export orders</button>:null}</div>
  {(tab==='Overview'||tab==='Analytics')&&<><div className="periodrow"><span>Store performance</span>{dateControl}</div>{metrics}<div className="overviewgrid"><section className="panel"><div className="panelhead"><div><h2>Traffic overview</h2><p>Your visits over the last 7 days</p></div><span className="legend"><i/>Page visits</span></div><div className="chart"><div className="chartbars">{Array.from({length:7},(_,i)=>{const day=new Date(Date.now()-(6-i)*86400000).toISOString().slice(0,10);const v=data.visits.filter((x:any)=>x.day===day).reduce((n:number,x:any)=>n+x.count,0);const max=Math.max(1,...Array.from({length:7},(_,j)=>data.visits.filter((x:any)=>x.day===new Date(Date.now()-j*86400000).toISOString().slice(0,10)).reduce((n:number,x:any)=>n+x.count,0)));return <div key={day}><span>{v}</span><div className="bar" style={{height:Math.max(2,v/max*120)+'px'}}/><small>{new Date(day+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</small></div>})}</div></div></section><section className="panel storehealth"><div className="panelhead"><h2>Store snapshot</h2><Globe size={18}/></div><div className="snapshot"><div><span>Published pages</span><strong>{pages.filter((p:any)=>p.status==='published').length}<small>of {pages.length} total</small></strong></div><div><span>Open order value</span><strong>{money(activeOrders.filter((o:any)=>o.status!=='delivered').reduce((n:number,o:any)=>n+o.total,0))}</strong></div><div><span>Awaiting confirmation</span><strong>{newOrders}</strong></div></div><button className="textbutton" onClick={()=>navigate('Orders')}>Manage your orders<ArrowUpRight size={16}/></button></section></div></>}
  {tab==='Overview'&&<><section className="panel"><div className="panelhead"><div><h2>Your landing pages</h2><p>A dedicated storefront for every product.</p></div><button className="textbutton" onClick={()=>navigate('Landing pages')}>View all pages<ArrowUpRight size={16}/></button></div>{pages.filter((p:any)=>p.status!=='archived').slice(0,2).map((p:any)=><div className="productrow" key={p.id}>{p.image?<img src={p.image} alt={p.name}/>:<div className="productplaceholder"><ShoppingBag/></div>}<div><h3>{p.name}</h3><p>/p/{p.slug}</p><Badge status={p.status}/></div><div className="price">{money(p.price)}<small>Product price</small></div><button onClick={()=>{setEditor({...p});setTab('Landing pages')}}><Pencil size={15}/>Edit page</button></div>)}</section><section className="panel"><div className="panelhead"><div><h2>Recent orders</h2><p>The latest from all your storefronts.</p></div><button className="textbutton" onClick={()=>navigate('Orders')}>View all orders<ArrowUpRight size={16}/></button></div>{orderTable(allOrders.slice(0,5))}</section></>}
  {tab==='Landing pages'&&<><div className="toolbar"><div className="tabs">{['all','published','draft','archived'].map(t=><button key={t} className={filter===t?'active':''} onClick={()=>setFilter(t)}>{t==='all'?'All pages':t[0].toUpperCase()+t.slice(1)} <span>{t==='all'?pages.length:pages.filter((p:any)=>p.status===t).length}</span></button>)}</div><div className="search"><Search size={17}/><input aria-label="Search pages" placeholder="Search your pages…" value={query} onChange={e=>setQuery(e.target.value)}/></div></div><div className="pagegrid">{visiblePages.map((p:any)=><article className="pagecard" key={p.id}><div className={'pagecover '+p.template}>{p.image?<img src={p.image} alt={p.name}/>:<div className="blankcover"><Leaf size={40}/><strong>{b.name}</strong></div>}<Badge status={p.status}/></div><div className="pageinfo"><h2>{p.name}</h2><div className="pageurl">/p/{p.slug}<button className="iconbutton" title="Copy page URL" onClick={async()=>{try{await navigator.clipboard.writeText(location.origin+'/p/'+p.slug);setToast('Page URL copied.')}catch{setToast('Your page URL is /p/'+p.slug)}}}><Copy size={14}/></button></div><div className="pagestats"><span><strong>{money(p.price)}</strong><small>Price</small></span><span><strong>{allOrders.filter((o:any)=>o.page_id===p.id).length}</strong><small>Orders</small></span><span><strong>{data.visits.filter((v:any)=>v.page_id===p.id).reduce((n:number,v:any)=>n+v.count,0)}</strong><small>Visits</small></span></div><div className="pageactions"><button onClick={()=>{setEditor({...p});setTab('Landing pages')}}><Pencil size={15}/>Edit page</button>{p.status==='published'&&<a className="button iconbutton" href={'/p/'+p.slug} target="_blank" rel="noreferrer" title="View published page"><ExternalLink size={16}/></a>}<button className="iconbutton" title="Duplicate page" disabled={busy} onClick={()=>duplicate(p)}><Copy size={16}/></button><button className="iconbutton" title={p.status==='archived'?'Restore draft':'Archive page'} disabled={busy} onClick={()=>{if(p.status==='archived'||window.confirm('Archive this page? Its URL will stop accepting orders. Existing orders will remain.'))save({action:'page',page:{...p,status:p.status==='archived'?'draft':'archived'}},p.status==='archived'?'Page restored as draft.':'Page archived.')}}><Archive size={16}/></button></div></div></article>)}<button className="newpagecard" onClick={()=>newPage()}><span><Plus size={26}/></span><strong>Your next bestseller</strong><p>Give a new product its own page.</p><span className="newpagelink">Create landing page</span></button></div></>}
  {tab==='Orders'&&<section className="panel"><div className="toolbar ordertoolbar"><div className="search"><Search size={17}/><input aria-label="Search orders" placeholder="Search customer, phone, product…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="toolbarcontrols"><select aria-label="Order status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>{['new','confirmed','shipped','delivered','cancelled'].map(s=><option key={s}>{s}</option>)}</select>{dateControl}</div></div>{orderTable(visibleOrders)}<div className="tablefoot">{visibleOrders.length} order{visibleOrders.length!==1?'s':''} · Sales are counted when an order is delivered.</div></section>}
  {tab==='Analytics'&&<><section className="panel"><div className="panelhead"><div><h2>Product performance</h2><p>Compare every landing page in the selected period.</p></div><span className="muted">{pages.length} products</span></div>{performance}</section><div className="infobox"><ChartNoAxesCombined size={22}/><p>Visits count each browser session once per product per day. Administrator previews are excluded. Conversion is placed orders divided by visits; sales include delivered orders only. Dates are recorded in UTC.</p></div></>}
  {tab==='Brand settings'&&<form onSubmit={async e=>{e.preventDefault();const r=await save({action:'brand',brand:branding||b},'Brand updated across every landing page.');if(r)setBranding(null)}}><div className="settingsgrid"><div><section className="panel"><div className="panelhead"><div><h2>Brand identity</h2><p>Changes apply to the dashboard and all product pages.</p></div><Globe size={20}/></div><div className="settingsbody"><label>Brand name<input required maxLength={60} value={(branding||b).name} onChange={e=>setBranding({...branding||b,name:e.target.value})}/></label><label>Tagline<input maxLength={120} value={(branding||b).tagline} onChange={e=>setBranding({...branding||b,tagline:e.target.value})}/></label><ImageField label="Global logo" value={(branding||b).logo} onChange={(logo:string)=>setBranding({...branding||b,logo})}/><label>Brand color<div className="colorinput"><input aria-label="Choose brand color" type="color" value={(branding||b).color} onChange={e=>setBranding({...branding||b,color:e.target.value})}/><input pattern="#[a-fA-F0-9]{6}" value={(branding||b).color} onChange={e=>setBranding({...branding||b,color:e.target.value})}/></div></label><label>Customer support phone<input value={(branding||b).phone} onChange={e=>setBranding({...branding||b,phone:e.target.value})} placeholder="+212 …"/></label><label>Currency<input value="Moroccan dirham (MAD / DH)" disabled/></label></div><div className="panelfoot"><button className="primary" disabled={busy}>{busy?'Saving…':'Save brand settings'}</button></div></section></div><div><section className="panel brandpreview"><div className="panelhead"><h2>Brand preview</h2></div><div style={{'--brand':(branding||b).color} as any}><Logo brand={branding||b}/><div className="brandpreviewhero"><Leaf size={40}/><h2>Your brand.<br/>Every storefront.</h2><span className="storebutton">Order now</span></div></div></section><div className="infobox"><ShieldCheck size={23}/><p>Only the store administrator can access orders and edit settings. Your site starts private; you can share it when you’re ready.</p></div></div></div></form>}
  <div className="workspacefooter"><span>{b.name} Store Studio</span><span>Built for your next chapter.</span></div></div>}</main>
  {detail&&<div className="modalbackdrop" onClick={()=>setDetail(null)}><section className="modal ordermodal" role="dialog" aria-modal="true" aria-label="Order details" onClick={e=>e.stopPropagation()}><button className="close iconbutton" onClick={()=>setDetail(null)} aria-label="Close"><X size={20}/></button><div className="eyebrow">ORDER #{detail.id.slice(0,8).toUpperCase()}</div><h1>{detail.customer}</h1><p>{niceDate(detail.created_at)}</p><div className="detailgrid"><div><h3>Customer details</h3><a href={'tel:'+detail.phone}>{detail.phone}</a><p>{detail.address}<br/>{detail.city}</p></div><div><h3>Order summary</h3><p>{detail.product}<br/>{detail.quantity} × {money(detail.unit_price)}<br/>Delivery: {money(detail.shipping)}</p><strong>{money(detail.total)}</strong></div></div>{detail.notes&&<div className="infobox"><p>{detail.notes}</p></div>}<form onSubmit={async e=>{e.preventDefault();const r=await save({action:'status',id:detail.id,status:detail.status},'Order status updated.');if(r)setDetail(null)}}><label>Order status<select value={detail.status} onChange={e=>setDetail({...detail,status:e.target.value})}>{['new','confirmed','shipped','delivered','cancelled'].map(s=><option key={s}>{s}</option>)}</select></label><button className="primary" disabled={busy}>{busy?'Saving…':'Update status'}</button></form></section></div>}</div>
}
