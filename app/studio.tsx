'use client';
import {useState,useEffect,useCallback} from 'react';
import {LayoutDashboard,PanelsTopLeft,ShoppingBag,ChartNoAxesCombined,Settings,Plus,Leaf,ArrowUpRight,Globe,MousePointer2,Wallet,Search,ChevronDown,Download,ExternalLink,Copy,Pencil,X,Monitor,Smartphone,Check,Archive,RefreshCw,ImagePlus,ArrowLeft,ArrowRight,Eye,ShieldCheck,Upload,LogOut,Lock,MessageCircle,Trash2,Bell} from 'lucide-react';
import {Logo,ProductView} from './storefront';
import {enablePush} from '@/lib/push-client';
import JSZip from 'jszip';

const money=(n:number)=>new Intl.NumberFormat('en-MA',{maximumFractionDigits:2}).format(n)+' DH';
const niceDate=(s:string)=>new Date(s).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Casablanca'});
const navs:any[]=[[LayoutDashboard,'Overview'],[PanelsTopLeft,'Landing pages'],[ShoppingBag,'Orders'],[ChartNoAxesCombined,'Analytics'],[Settings,'Brand settings']];

function safeLocalStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage) window.localStorage.setItem(key, value);
  } catch {}
}

function playNotificationChime() {
  try {
    if (typeof window === 'undefined') return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

async function api(body?:any){
  let sessionToken = '';
  if (typeof window !== 'undefined') {
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie.match(/(?:^|;\s*)admin_session=([^;]+)/);
      if (match && match[1]) sessionToken = match[1];
    }
    if (!sessionToken) {
      sessionToken = safeLocalStorageGet('layane_admin_session') || '';
    }
  }

  const reqHeaders: any = { 'Content-Type': 'application/json' };
  if (sessionToken) {
    reqHeaders['Authorization'] = `Bearer ${sessionToken}`;
    reqHeaders['X-Session'] = sessionToken;
  }

  const r = await fetch('/api/store', body ? {
    method: 'POST',
    headers: reqHeaders,
    body: JSON.stringify(body)
  } : {
    headers: reqHeaders
  });

  const text = await r.text();
  let d: any = {};
  try {
    d = JSON.parse(text);
  } catch (err) {
    if (r.status === 401 || text.includes('AUTH')) {
      throw new Error('Please sign in to manage your store.');
    }
    throw new Error('Unable to complete this request. Please try again.');
  }

  if (!r.ok) throw new Error(d.error || 'Server error');
  return d;
}

function Badge({status}:any){return <span className={'pill '+status}>{status}</span>}
function compressImage(file:File):Promise<File>{return new Promise((resolve)=>{if(file.size<=1.5*1024*1024||!file.type.startsWith('image/'))return resolve(file);const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);const canvas=document.createElement('canvas');let{width,height}=img;const maxDim=1920;if(width>maxDim||height>maxDim){if(width>height){height=Math.round((height*maxDim)/width);width=maxDim}else{width=Math.round((width*maxDim)/height);height=maxDim}}canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)return resolve(file);ctx.drawImage(img,0,0,width,height);canvas.toBlob((blob)=>{if(!blob)return resolve(file);resolve(new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'}))},'image/jpeg',0.82)};img.onerror=()=>resolve(file);img.src=url})}
function readFileAsDataUrl(file:File):Promise<string>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result as string);reader.onerror=reject;reader.readAsDataURL(file)})}
function Empty({icon:Icon=ShoppingBag,title,text,action}:any){return <div className="empty"><span><Icon size={28}/></span><h3>{title}</h3><p>{text}</p>{action}</div>}

function getWhatsAppUrl(phoneStr: string) {
  let clean = String(phoneStr || '').replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '212' + clean.slice(1);
  }
  return `https://wa.me/${clean}`;
}

function ImageField({value,onChange,label='صورة البانر الرئيسية'}:any){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function upload(e:any){
    const file=e.target.files?.[0];
    if(!file)return;
    setBusy(true);
    setError('');
    try{
      const fileToUpload=await compressImage(file);
      try {
        const body=new FormData();
        body.append('file',fileToUpload);
        const r=await fetch('/api/upload',{method:'POST',body});
        const resText=await r.text();
        let d:any;
        try{d=JSON.parse(resText)}catch{}
        if(r.ok&&d?.url){
          onChange(d.url);
          return;
        }
      } catch {}

      const dataUrl = await readFileAsDataUrl(fileToUpload);
      onChange(dataUrl);
    }catch(e:any){
      setError(e.message||'فشل رفع الصورة');
    }finally{
      setBusy(false);
    }
  }
  return <div className="imagefield"><label>{label}<input value={value} placeholder="https://… or upload an image" onChange={e=>onChange(e.target.value)}/></label><div>{value&&<img src={value} alt={label}/>}<label className="upload"><ImagePlus size={16}/>{busy?'Uploading…':'Upload image'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} disabled={busy}/></label>{value&&<button type="button" className="textbutton" onClick={()=>onChange('')}>Remove</button>}</div>{error&&<p className="error">{error}</p>}</div>
}

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
          let uploadedUrl = '';
          try {
            const body=new FormData();
            body.append('file',fileToUpload);
            const r=await fetch('/api/upload',{method:'POST',body});
            const d=await r.json();
            if(r.ok&&d?.url){
              uploadedUrl = d.url;
            }
          } catch {}

          if (!uploadedUrl) {
            uploadedUrl = await readFileAsDataUrl(fileToUpload);
          }

          uploadedImages.push(uploadedUrl);
          if(htmlText){
            const filename=relativePath.split('/').pop();
            if(filename){
              htmlText=htmlText.replaceAll(relativePath,uploadedUrl).replaceAll(filename,uploadedUrl);
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
        let uploadedUrl = '';
        try {
          const body=new FormData();
          body.append('file',fileToUpload);
          const r=await fetch('/api/upload',{method:'POST',body});
          const resText=await r.text();
          let d:any;
          try{d=JSON.parse(resText)}catch{}
          if(r.ok&&d?.url){
            uploadedUrl = d.url;
          }
        } catch {}

        if (!uploadedUrl) {
          uploadedUrl = await readFileAsDataUrl(fileToUpload);
        }

        newUrls.push(uploadedUrl);
      }
      onChange(newUrls);
    }catch(err:any){
      setError(err.message||'فشل رفع الصور');
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

function AdminManager({ admins, onReload }: any) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    username: '',
    password: '',
    role: 'full',
    permissions: ['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings']
  });

  const allTabs = [
    { label: 'Overview', name: 'Overview / نظرة عامة' },
    { label: 'Landing pages', name: 'Landing pages / صفحات الهبوط' },
    { label: 'Orders', name: 'Orders / الطلبيات والزبناء' },
    { label: 'Analytics', name: 'Analytics / الإحصائيات' },
    { label: 'Brand settings', name: 'Brand settings / إعدادات المتجر والمشرفين' }
  ];

  function handleRolePreset(preset: string) {
    if (preset === 'full') {
      setNewAdmin({ ...newAdmin, role: 'full', permissions: ['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings'] });
    } else if (preset === 'orders_only') {
      setNewAdmin({ ...newAdmin, role: 'orders_only', permissions: ['Orders'] });
    } else if (preset === 'pages_only') {
      setNewAdmin({ ...newAdmin, role: 'pages_only', permissions: ['Landing pages'] });
    } else {
      setNewAdmin({ ...newAdmin, role: 'custom' });
    }
  }

  function togglePermission(tabLabel: string) {
    const list = [...newAdmin.permissions];
    const idx = list.indexOf(tabLabel);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(tabLabel);
    }
    setNewAdmin({ ...newAdmin, permissions: list, role: 'custom' });
  }

  async function handleAddAdmin(e: any) {
    e.preventDefault();
    if (!newAdmin.permissions || newAdmin.permissions.length === 0) {
      setError('يرجى اختيار صلاحية واحدة على الأقل لهذا المشرف');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api({ action: 'add_admin', admin: newAdmin });
      setNewAdmin({
        name: '',
        username: '',
        password: '',
        role: 'full',
        permissions: ['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings']
      });
      await onReload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAdmin(id: string) {
    if (!window.confirm('Are you sure you want to remove this administrator account?')) return;
    setBusy(true);
    try {
      await api({ action: 'delete_admin', id });
      await onReload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" style={{ marginTop: '25px' }}>
      <div className="panelhead">
        <div>
          <h2>Team Administrators & Permissions</h2>
          <p>Control exact tabs and sections each administrator can view and manage</p>
        </div>
        <ShieldCheck size={20} />
      </div>
      <div className="settingsbody">
        {error && <p className="error" style={{ marginBottom: '15px' }}>{error}</p>}
        {admins && admins.length > 0 && (
          <div className="tablewrap" style={{ marginBottom: '22px' }}>
            <table>
              <thead>
                <tr>
                  <th>Administrator Name</th>
                  <th>Username</th>
                  <th>Allowed Access / الصلاحيات</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a: any) => (
                  <tr key={a.id || a.username}>
                    <td className="strong">{a.id === 'default-admin' ? 'Primary Administrator' : a.name}</td>
                    <td><code style={{ background: '#eef3eb', padding: '3px 8px', borderRadius: '4px', color: '#205b44', fontWeight: '700' }}>{a.username}</code></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {(a.permissions || ['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings']).map((p: string) => (
                          <span key={p} style={{ background: '#e8f5e9', color: '#1b5e20', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td><span className="pill published">{a.role === 'orders_only' ? 'Orders Staff' : a.role === 'pages_only' ? 'Content Staff' : 'Admin'}</span></td>
                    <td>
                      {a.id !== 'default-admin' && (
                        <button type="button" className="iconbutton" title="Remove administrator" onClick={() => handleDeleteAdmin(a.id)} style={{ color: '#d32f2f' }}>
                          <X size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={handleAddAdmin} style={{ background: '#fafbf9', padding: '20px', borderRadius: '12px', border: '1px solid #e1e9df' }}>
          <h3 style={{ fontSize: '15px', margin: '0 0 14px 0', color: '#205b44', fontWeight: '800' }}>إضافة مشرف جديد وتحديد صلاحياته (Add Admin & Set Access)</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            <label style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>
              Admin Name
              <input required placeholder="e.g. Youssef" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} dir="ltr" style={{ marginTop: '6px' }} />
            </label>
            <label style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>
              Username
              <input required placeholder="e.g. youssef" value={newAdmin.username} onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })} dir="ltr" style={{ marginTop: '6px' }} />
            </label>
            <label style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>
              Password
              <input required type="password" placeholder="••••••••" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} dir="ltr" style={{ marginTop: '6px' }} />
            </label>
            <label style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>
              Access Level / مستوى الصلاحية
              <select value={newAdmin.role} onChange={e => handleRolePreset(e.target.value)} style={{ marginTop: '6px' }}>
                <option value="full">Full Access (كل الصلاحيات)</option>
                <option value="orders_only">Orders Only (إدارة الطلبيات فقط - Call Center)</option>
                <option value="pages_only">Landing Pages Only (صفحات الهبوط فقط)</option>
                <option value="custom">Custom Permissions (تحديد يدوي)</option>
              </select>
            </label>
          </div>

          <div style={{ background: '#fff', padding: '14px 16px', borderRadius: '8px', border: '1px solid #dce4db', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#3f5546', display: 'block', marginBottom: '10px' }}>
              الأقسام المسموح لهذا المشرف برؤيتها والتحكم فيها (Allowed Sections):
            </span>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {allTabs.map(t => (
                <label key={t.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={newAdmin.permissions.includes(t.label)}
                    onChange={() => togglePermission(t.label)}
                    style={{ width: '16px', height: '16px', accentColor: '#205b44' }}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="primary" disabled={busy} style={{ height: '42px', padding: '0 24px' }}>
            {busy ? 'Saving…' : 'إضافة المشرف وتحديد الصلاحيات (Add Admin)'}
          </button>
        </form>
      </div>
    </section>
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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [notifGranted, setNotifGranted] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', {updateViaCache: 'none'}).catch(() => {});
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  async function requestNotificationPermission() {
    setNotifBusy(true);
    try {
      if (!('Notification' in window)) throw new Error('هذا المتصفح لا يدعم الإشعارات. استعمل Chrome أو Edge.');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw new Error('الإشعارات محظورة. فعّلها من إعدادات الموقع والتطبيق ثم حاول مجدداً.');
      await enablePush(true);
      setNotifGranted(true);
      setToast('تم إرسال إشعار تجريبي إلى هذا الجهاز.');
    } catch (e) {
      setNotifGranted(false);
      setError(e instanceof Error ? e.message : 'تعذر تفعيل الإشعارات');
    } finally { setNotifBusy(false); }
  }

  const canReceiveOrders = Boolean(data?.permissions?.includes('Orders'));
  useEffect(() => {
    if (!canReceiveOrders || !('Notification' in window) || Notification.permission !== 'granted') return;
    let cancelled = false;
    enablePush().then(() => { if (!cancelled) setNotifGranted(true); }).catch((e) => {
      if (!cancelled) { setNotifGranted(false); setError(e.message); }
    });
    return () => { cancelled = true; };
  }, [canReceiveOrders]);

  const reload = useCallback(async (isBackground = false) => {
    try {
      const d = await api();
      if (d && Array.isArray(d.orders) && d.orders.length > 0) {
        const latestOrder = d.orders[0];
        const lastSeenId = safeLocalStorageGet('layane_last_seen_order');

        if (latestOrder && latestOrder.id !== lastSeenId) {
          if (lastSeenId) {
            playNotificationChime();
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(`🚨 طلب جديد #${latestOrder.id.slice(0, 8).toUpperCase()}!`, {
                body: `الزبون: ${latestOrder.customer} (${latestOrder.city}) • المجموع: ${latestOrder.total} DH`,
                icon: '/icon.png',
                badge: '/icon.png'
              });
            }
          }
          safeLocalStorageSet('layane_last_seen_order', latestOrder.id);
        }
      }
      setData(d);
      setError('');
      setLoginErr('');
      return d;
    } catch (e: any) {
      if (!isBackground) {
        setError(e.message || 'فشل الاتصال بالخادم');
      }
    }
  }, []);

  useEffect(() => {
    reload(false);
    const interval = setInterval(() => {
      reload(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [reload]);

  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(t)}},[toast]);
  useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape'){setDetail(null)}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[]);

  useEffect(() => {
    if (data?.permissions && data.permissions.length > 0) {
      if (!data.permissions.includes(tab)) {
        setTab(data.permissions[0]);
      }
    }
  }, [data, tab]);

  const newOrdersCount = data && Array.isArray(data.orders) ? data.orders.filter((o: any) => o.status === 'new').length : 0;

  useEffect(() => {
    if (data && typeof window !== 'undefined' && typeof document !== 'undefined') {
      if (newOrdersCount > 0) {
        document.title = `🔴 (${newOrdersCount}) ORDERS - layane-shop Studio`;
      } else {
        document.title = 'layane-shop Store Studio';
      }
    }
  }, [data, newOrdersCount]);

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
      if (d.session) {
        if (typeof document !== 'undefined') {
          const isHttps = location.protocol === 'https:';
          document.cookie = `admin_session=${d.session}; path=/; max-age=2592000; SameSite=Lax${isHttps ? '; Secure' : ''}`;
        }
        safeLocalStorageSet('layane_admin_session', d.session);
      }
      await reload(false);
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
      if (typeof document !== 'undefined') {
        document.cookie = 'admin_session=; path=/; max-age=0; SameSite=Lax';
      }
      safeLocalStorageSet('layane_admin_session', '');
      setData(null);
      setError('AUTH');
    } catch {}
  }

  function navigate(t:string){
    if (data?.permissions && !data.permissions.includes(t)) {
      alert('ليس لديك صلاحية للوصول إلى هذا القسم.');
      return;
    }
    if(branding&&!window.confirm('Leave brand settings? Unsaved changes will be lost.'))return;
    if(editor&&!window.confirm('Leave the editor? Unsaved changes will be lost.'))return;
    setEditor(null);
    setTab(t);
    setQuery('');
    setFilter('all');
    setBranding(null);
  }

  async function save(body:any,message:string){setBusy(true);setError('');try{await api(body);const d=await reload(false);setToast(message);return d}catch(e:any){setError(e.message);return null}finally{setBusy(false)}}
  async function savePage(status?:string){const p={...editor,status:status||editor.status};const result=await save({action:'page',page:p},p.status==='published'?'Page published. Your storefront is ready.':'Page saved.');if(result)setEditor(p)}
  async function duplicate(p:any){const id=crypto.randomUUID();const cp={...p,id,slug:p.slug+'-'+id.slice(0,5),name:p.name+' (copy)',status:'draft',createdAt:new Date().toISOString()};const result=await save({action:'page',page:cp},'Page duplicated as a draft.');if(result){setEditor(cp)}}
  function newPage(){const id=crypto.randomUUID();setEditor({id,name:'Untitled product',slug:'product-'+id.slice(0,8),price:199,comparePrice:0,shipping:0,status:'draft',template:'editorial',language:'ar',headline:'',description:'',image:'',images:[],reviewsImage:'',customHtml:'',benefits:'',cta:'اطلب الآن',sections:[],faq:[],createdAt:new Date().toISOString()});setTab('Landing pages')}
  function exportOrders(rows:any[]){const fields=['id','customer','phone','city','address','product','quantity','unit_price','shipping','total','status','created_at','notes'];const cell=(x:any)=>'"'+String(x??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';const csv='\uFEFF'+[fields.join(','),...rows.map(o=>fields.map(k=>cell(o[k])).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='layane-shop-orders.csv';a.click();URL.revokeObjectURL(url)}

  if (!data) {
    return (
      <div className="login-backdrop">
        <form className="login-card" onSubmit={handleLogin} autoComplete="off">
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
              placeholder="ادخل اسم المستخدم"
              autoComplete="username"
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
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="storebutton" disabled={busy} style={{ width: '100%', marginTop: '10px' }}>
            {busy ? 'جار التحقق…' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    );
  }

  const userPerms = data.permissions || ['Overview', 'Landing pages', 'Orders', 'Analytics', 'Brand settings'];
  const allowedNavs = navs.filter(([_, label]) => userPerms.includes(label));
  const activeUser = data.currentAdmin || { name: 'Primary Administrator', username: 'admin', role: 'full' };

  const b=data.brand;const pages=data.pages;const allOrders=data.orders;const since=range==='all'?'':new Date(Date.now()-Number(range)*86400000).toISOString();const orders=allOrders.filter((o:any)=>!since||o.created_at>=since);const visits=data.visits.filter((v:any)=>!since||v.day>=since.slice(0,10));const visitCount=visits.reduce((n:number,v:any)=>n+v.count,0);const activeOrders=orders.filter((o:any)=>o.status!=='cancelled');const sales=orders.filter((o:any)=>o.status==='delivered').reduce((n:number,o:any)=>n+o.total,0);const conversion=visitCount?(orders.length/visitCount*100).toFixed(1):'0';const newOrders=allOrders.filter((o:any)=>o.status==='new').length;
  const mainHomeId = data.mainHomePageId || (pages.find((p: any) => p.status === 'published')?.id || '');

  const visiblePages=pages.filter((p:any)=>(filter==='all'||p.status===filter)&&p.name.toLowerCase().includes(query.toLowerCase()));const visibleOrders=orders.filter((o:any)=>(filter==='all'||o.status===filter)&&[o.customer,o.phone,o.product,o.id].some((v:string)=>v.toLowerCase().includes(query.toLowerCase())));const dateControl=<select className="datefilter" aria-label="Date range" value={range} onChange={e=>setRange(e.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option></select>;
  const performance=<div className="tablewrap"><table><thead><tr><th>Product</th><th>Visits</th><th>Orders</th><th>Conversion</th><th>Sales</th></tr></thead><tbody>{pages.filter((p:any)=>p.status!=='archived').map((p:any)=>{const v=visits.filter((x:any)=>x.page_id===p.id).reduce((n:number,x:any)=>n+x.count,0);const o=orders.filter((x:any)=>x.page_id===p.id);return <tr key={p.id}><td><div className="tableproduct">{p.image?<img src={p.image} alt=""/>:<span className="productplaceholder"><ShoppingBag size={18}/></span>}<span>{p.name}<small>/p/{p.slug}</small></span></div></td><td>{v.toLocaleString()}</td><td>{o.length}</td><td>{v?(o.length/v*100).toFixed(1):0}%</td><td className="strong">{money(o.filter((x:any)=>x.status==='delivered').reduce((n:number,x:any)=>n+o.total,0))}</td></tr>})}</tbody></table></div>;

  const orderTable=(rows:any[])=>rows.length?(
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Order / customer</th>
            <th>Phone / WhatsApp</th>
            <th>Product</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o:any)=>(
            <tr key={o.id}>
              <td>
                <button className="tablelink" onClick={()=>setDetail(o)} style={{fontWeight:'700'}}>
                  {o.customer}
                </button>
                <small>#{o.id.slice(0,8).toUpperCase()}</small>
              </td>
              <td>
                <a
                  href={getWhatsAppUrl(o.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-chat-btn"
                  title="Tawasol via WhatsApp"
                  onClick={(e)=>e.stopPropagation()}
                >
                  <MessageCircle size={15}/>
                  <span dir="ltr">{o.phone}</span>
                </a>
              </td>
              <td>{o.product}<small>{o.quantity} item{o.quantity>1?'s':''} · {o.city}</small></td>
              <td className="strong">{money(o.total)}</td>
              <td><Badge status={o.status}/></td>
              <td>{niceDate(o.created_at)}</td>
              <td>
                <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                  <button className="iconbutton" title="Order details" onClick={()=>setDetail(o)}>
                    <ArrowUpRight size={16}/>
                  </button>
                  <button
                    className="iconbutton"
                    title="Delete Order"
                    onClick={async (e)=>{
                      e.stopPropagation();
                      if(window.confirm('Are you sure you want to permanently delete this order?')){
                        await save({action:'delete_order',id:o.id},'Order deleted successfully.');
                      }
                    }}
                    style={{color:'#d32f2f'}}
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ):<Empty title={query||filter!=='all'?'No matching orders':'Your next order starts here'} text={query||filter!=='all'?'Try another search or status.':'Orders from all your landing pages will appear here.'} action={!query&&filter==='all'&&userPerms.includes('Landing pages')&&<button onClick={()=>navigate('Landing pages')}>Manage landing pages</button>}/>;

  const metrics=<div className="stats">{[[Wallet,'Total sales',money(sales),'Delivered orders only'],[ShoppingBag,'Total orders',orders.length.toLocaleString(),`${newOrders} awaiting confirmation`],[MousePointer2,'Page visits',visitCount.toLocaleString(),'Unique page sessions per day'],[ChartNoAxesCombined,'Conversion rate',conversion+'%','Orders ÷ page visits']].map(([Icon,label,value,hint]:any)=><div className="stat" key={label}><div><span>{label}</span><span className="statIcon"><Icon size={18}/></span></div><strong>{value}</strong><small>{hint}</small></div>)}</div>;

  return (
    <div className="studio" style={{'--brand':b.color} as any}>
      <aside>
        <Logo brand={{...b,tagline:'STORE STUDIO'}}/>
        <div className="workspace">
          <span className="workspaceicon">{b.name[0].toUpperCase()}</span>
          <div>{b.name} store<small>Your workspace</small></div>
          <ChevronDown size={15}/>
        </div>
        <div className="navlabel">WORKSPACE</div>
        <nav>
          {allowedNavs.map(([Icon,label])=>(
            <button key={label} className={tab===label?'selected':''} onClick={()=>navigate(label)}>
              <Icon size={19}/>
              {label}
              {label==='Orders'&&newOrders>0&&<span className="red-notif-badge">{newOrders}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebottom">
          {userPerms.includes('Brand settings')&&<div className="brandnote"><Globe size={21}/><strong>One brand. Every page.</strong><p>Your storefronts, connected.</p><button className="textbutton" onClick={()=>navigate('Brand settings')}>Manage your brand<ArrowUpRight size={14}/></button></div>}<div className="account" style={{justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:'10px'}}><div className="avatar" style={{background:'#205b44',color:'#fff',fontWeight:'800'}}>{activeUser.name[0].toUpperCase()}</div><div><strong style={{display:'block',fontSize:'13px',color:'#1a3328',lineHeight:'1.2'}}>{activeUser.name}</strong><small style={{color:'#526959',fontSize:'11px'}}>@{activeUser.username}</small></div></div><button type="button" onClick={handleLogout} title="Sign Out" style={{border:0,background:'transparent',cursor:'pointer',color:'#839487'}}><LogOut size={17}/></button></div></div>
      </aside>
      <main>
        <header>
          <span>Workspace <span className="slash">/</span><strong>{tab}</strong></span>
          <div className="headerend">
            {deferredPrompt && (
              <button
                type="button"
                className="install-app-btn"
                onClick={async () => {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  if (outcome === 'accepted') setDeferredPrompt(null);
                }}
              >
                <Smartphone size={14} />
                <span>تثبيت التطبيق 📲</span>
              </button>
            )}

            <div className="bell-badge-wrap">
              <button
                className="iconbutton"
                type="button"
                title={notifGranted ? 'الإشعارات الفورية مفعّلة' : 'تفعيل الإشعارات الفورية'}
                onClick={requestNotificationPermission}
                disabled={notifBusy}
                aria-label={notifGranted ? 'اختبار الإشعارات' : 'تفعيل الإشعارات'}
                style={{ color: notifGranted ? '#205b44' : '#888' }}
              >
                <Bell size={18} />
              </button>
              {newOrders > 0 && <span className="bell-red-dot">{newOrders > 9 ? '9+' : newOrders}</span>}
            </div>

            <span className="livebadge"><span/>{activeUser.name} (@{activeUser.username})</span>
            <button className="iconbutton" title="Refresh store data" onClick={()=>reload(false)}><RefreshCw size={17}/></button>
            <div className="avatar">{activeUser.name[0].toUpperCase()}</div>
          </div>
        </header>
        {error&&<div className="error banner" role="alert">{error}<button onClick={()=>setError('')} aria-label="Dismiss error"><X size={16}/></button></div>}
        {toast&&<div className="toast" role="status"><Check size={18}/>{toast}</div>}
        {editor?(
          <div className="editor">
            <div className="edithead">
              <div>
                <button className="iconbutton" onClick={()=>{if(window.confirm('Leave the editor? Make sure your changes are saved.'))setEditor(null)}} aria-label="Back to pages"><ArrowLeft size={20}/></button>
                <div><h2>{editor.name}</h2><small>/p/{editor.slug} <Badge status={editor.status}/></small></div>
              </div>
              <div><button disabled={busy} onClick={()=>savePage()}>Save changes</button><button className="primary" disabled={busy} onClick={()=>savePage(editor.status==='published'?'draft':'published')}>{editor.status==='published'?'Unpublish':'Publish page'}</button></div>
            </div>
            <div className="editorbody">
              <div className="editfields">
                <form id="page-editor" onSubmit={e=>{e.preventDefault();savePage()}}>
                  <div className="fieldsection">
                    <h3>رفع وترتيب صفحة الهبوط (Landing Page Upload & Reorder)</h3>
                    <ZipUploader onHtmlLoaded={(customHtml:string)=>setEditor({...editor,customHtml})} onImagesLoaded={(images:string[])=>setEditor({...editor,images})}/>
                    <MultiImageUploader images={editor.images||[]} onChange={(images:string[])=>setEditor({...editor,images})}/>
                    <ImageField value={editor.image||''} onChange={(image:string)=>setEditor({...editor,image})} label="صورة البانر الرئيسية (Single Banner Image)"/>
                    <ImageField value={editor.reviewsImage||''} onChange={(reviewsImage:string)=>setEditor({...editor,reviewsImage})} label="صورة آراء وتقييمات الزبناء (Customer Reviews Image)"/>
                    <label>اسم المنتج (Product Name)<input dir="auto" required maxLength={120} value={editor.name} onChange={e=>setEditor({...editor,name:e.target.value})}/></label>
                    <label>رابط الصفحة (Page URL Slug)<input pattern="[a-z0-9]+(-[a-z0-9]+)*" required value={editor.slug} onChange={e=>setEditor({...editor,slug:e.target.value.toLowerCase().replaceAll(' ','-')})}/><small>/p/{editor.slug}</small></label>
                    <div className="formgrid"><label>السعر (Price DH)<input type="number" min="1" step="0.01" value={editor.price} onChange={e=>setEditor({...editor,price:+e.target.value})}/></label><label>السعر قبل التخفيض (DH)<input type="number" min="0" step="0.01" value={editor.comparePrice} onChange={e=>setEditor({...editor,comparePrice:+e.target.value})}/></label></div>
                    <div className="formgrid"><label>مصاريف التوصيل (DH)<input type="number" min="0" step="0.01" value={editor.shipping} onChange={e=>setEditor({...editor,shipping:+e.target.value})}/><small>0 = توصيل مجاني</small></label><label>نص زر الطلب<input dir="auto" value={editor.cta||'اطلب الآن'} onChange={e=>setEditor({...editor,cta:e.target.value})}/></label></div>
                    <label>لغة الصفحة<select value={editor.language||'ar'} onChange={e=>setEditor({...editor,language:e.target.value})}><option value="ar">العربية (right to left)</option><option value="en">English</option><option value="fr">Français</option></select></label>
                  </div>
                </form>
              </div>
              <div className="previewarea">
                <div className="previewbar">
                  <span><Eye size={15}/>Live preview</span>
                  <div><button aria-label="Desktop preview" className={!mobile?'active':''} onClick={()=>setMobile(false)}><Monitor size={17}/></button><button aria-label="Mobile preview" className={mobile?'active':''} onClick={()=>setMobile(true)}><Smartphone size={17}/></button></div>
                  <span>Unsaved changes shown</span>
                </div>
                <div className={'previewframe '+(mobile?'mobile':'')}><ProductView key={editor.id} page={editor} brand={b} preview/></div>
              </div>
            </div>
          </div>
        ):(
          <div className="content">
            <div className="pagetitle">
              <div>
                <div className="eyebrow">{tab==='Overview'?'YOUR BUSINESS, AT A GLANCE':tab==='Landing pages'?'YOUR PRODUCTS, THEIR OWN SPOTLIGHT':tab==='Orders'?'EVERY ORDER, ONE PLACE':tab==='Analytics'?'UNDERSTAND WHAT WORKS':'ONE IDENTITY, EVERYWHERE'}</div>
                <h1>{tab==='Overview'?'Store overview':tab}</h1>
                <p>{tab==='Overview'?'Every product. Every order. One place.':tab==='Landing pages'?'Create, customize, and grow your product storefronts.':tab==='Orders'?'From first click to doorstep. Keep every order moving.':tab==='Analytics'?'See how your pages turn visitors into customers.':'Keep every storefront unmistakably yours.'}</p>
              </div>
              {userPerms.includes('Landing pages')&&(tab==='Landing pages'||tab==='Overview')?<button className="primary" onClick={()=>newPage()}><Plus size={18}/>Create landing page</button>:tab==='Orders'?<button onClick={()=>exportOrders(visibleOrders)} disabled={!visibleOrders.length}><Download size={17}/>Export orders</button>:null}
            </div>

            {(tab==='Overview'||tab==='Analytics')&&userPerms.includes(tab)&&(
              <>
                <div className="periodrow"><span>Store performance</span>{dateControl}</div>
                {metrics}
                <div className="overviewgrid">
                  <section className="panel">
                    <div className="panelhead"><div><h2>Traffic overview</h2><p>Your visits over the last 7 days</p></div><span className="legend"><i/>Page visits</span></div>
                    <div className="chart">
                      <div className="chartbars">{Array.from({length:7},(_,i)=>{const day=new Date(Date.now()-(6-i)*86400000).toISOString().slice(0,10);const v=data.visits.filter((x:any)=>x.day===day).reduce((n:number,x:any)=>n+x.count,0);const max=Math.max(1,...Array.from({length:7},(_,j)=>data.visits.filter((x:any)=>x.day===new Date(Date.now()-j*86400000).toISOString().slice(0,10)).reduce((n:number,x:any)=>n+x.count,0)));return <div key={day}><span>{v}</span><div className="bar" style={{height:Math.max(2,v/max*120)+'px'}}/><small>{new Date(day+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</small></div>})}</div>
                    </div>
                  </section>
                  <section className="panel storehealth">
                    <div className="panelhead"><h2>Store snapshot</h2><Globe size={18}/></div>
                    <div className="snapshot">
                      <div><span>Published pages</span><strong>{pages.filter((p:any)=>p.status==='published').length}<small>of {pages.length} total</small></strong></div>
                      <div><span>Open order value</span><strong>{money(activeOrders.filter((o:any)=>o.status!=='delivered').reduce((n:number,o:any)=>n+o.total,0))}</strong></div>
                      <div><span>Awaiting confirmation</span><strong>{newOrders}</strong></div>
                    </div>
                    {userPerms.includes('Orders')&&<button className="textbutton" onClick={()=>navigate('Orders')}>Manage your orders<ArrowUpRight size={16}/></button>}
                  </section>
                </div>
              </>
            )}

            {tab==='Overview'&&userPerms.includes('Overview')&&(
              <>
                <section className="panel">
                  <div className="panelhead"><div><h2>Your landing pages</h2><p>A dedicated storefront for every product.</p></div>{userPerms.includes('Landing pages')&&<button className="textbutton" onClick={()=>navigate('Landing pages')}>View all pages<ArrowUpRight size={16}/></button>}</div>
                  {pages.filter((p:any)=>p.status!=='archived').slice(0,2).map((p:any)=><div className="productrow" key={p.id}>{p.image?<img src={p.image} alt={p.name}/>:<div className="productplaceholder"><ShoppingBag/></div>}<div><h3>{p.name}</h3><p>/p/{p.slug}</p><Badge status={p.status}/></div><div className="price">{money(p.price)}<small>Product price</small></div>{userPerms.includes('Landing pages')&&<button onClick={()=>{setEditor({...p});setTab('Landing pages')}}><Pencil size={15}/>Edit page</button>}</div>)}
                </section>
                <section className="panel">
                  <div className="panelhead"><div><h2>Recent orders</h2><p>The latest from all your storefronts.</p></div>{userPerms.includes('Orders')&&<button className="textbutton" onClick={()=>navigate('Orders')}>View all orders<ArrowUpRight size={16}/></button>}</div>
                  {orderTable(allOrders.slice(0,5))}
                </section>
              </>
            )}

            {tab==='Landing pages'&&userPerms.includes('Landing pages')&&(
              <>
                <div className="toolbar">
                  <div className="tabs">{['all','published','draft','archived'].map(t=><button key={t} className={filter===t?'active':''} onClick={()=>setFilter(t)}>{t==='all'?'All pages':t[0].toUpperCase()+t.slice(1)} <span>{t==='all'?pages.length:pages.filter((p:any)=>p.status===t).length}</span></button>)}</div>
                  <div className="search"><Search size={17}/><input aria-label="Search pages" placeholder="Search your pages…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
                </div>
                <div className="pagegrid">
                  {visiblePages.map((p:any)=>{
                    const isMainHome = p.id === mainHomeId;
                    return (
                      <article className="pagecard" key={p.id}>
                        <div className={'pagecover '+p.template}>
                          {p.image?<img src={p.image} alt={p.name}/>:(p.images&&p.images[0]?<img src={p.images[0]} alt={p.name}/>:<div className="blankcover"><Leaf size={40}/><strong>{b.name}</strong></div>)}
                          <div style={{position:'absolute',top:'14px',left:'14px',display:'flex',gap:'6px',flexWrap:'wrap'}}>
                            <Badge status={p.status}/>
                            {isMainHome&&<span className="pill" style={{background:'#205b44',color:'#fff',fontWeight:'800'}}>⭐ الصفحة الرئيسية (Main Homepage)</span>}
                          </div>
                        </div>
                        <div className="pageinfo">
                          <h2>{p.name}</h2>
                          <div className="pageurl">/p/{p.slug}<button className="iconbutton" title="Copy page URL" onClick={async()=>{try{await navigator.clipboard.writeText(location.origin+'/p/'+p.slug);setToast('Page URL copied.')}catch{setToast('Your page URL is /p/'+p.slug)}}}><Copy size={14}/></button></div>
                          <div className="pagestats"><span><strong>{money(p.price)}</strong><small>Price</small></span><span><strong>{allOrders.filter((o:any)=>o.page_id===p.id).length}</strong><small>Orders</small></span><span><strong>{data.visits.filter((v:any)=>v.page_id===p.id).reduce((n:number,v:any)=>n+v.count,0)}</strong><small>Visits</small></span></div>
                          <div className="pageactions" style={{flexWrap:'wrap',gap:'6px'}}>
                            <button onClick={()=>{setEditor({...p});setTab('Landing pages')}}><Pencil size={15}/>Edit page</button>

                            {p.status==='published'&&!isMainHome&&(
                              <button
                                type="button"
                                title="جعل هذه الصفحة هي الصفحة الرئيسية للموقع"
                                disabled={busy}
                                onClick={()=>save({action:'set_main_home',id:p.id},'تم تعيين هذه الصفحة كصفحة رئيسية للموقع بنجاح!')}
                                style={{background:'#f0fdf4',color:'#15803d',border:'1px solid #bbf7d0',fontWeight:'700'}}
                              >
                                ⭐ جعلها رئيسية
                              </button>
                            )}

                            {p.status==='published'&&<a className="button iconbutton" href={'/p/'+p.slug} target="_blank" rel="noreferrer" title="View published page"><ExternalLink size={16}/></a>}
                            <button className="iconbutton" title="Duplicate page" disabled={busy} onClick={()=>duplicate(p)}><Copy size={16}/></button>
                            <button className="iconbutton" title={p.status==='archived'?'Restore draft':'Archive page'} disabled={busy} onClick={()=>{if(p.status==='archived'||window.confirm('Archive this page? Its URL will stop accepting orders.'))save({action:'page',page:{...p,status:p.status==='archived'?'draft':'archived'}},p.status==='archived'?'Page restored as draft.':'Page archived.')}}><Archive size={16}/></button>
                            <button
                              className="iconbutton"
                              type="button"
                              title="حذف الصفحة نهائياً (Delete Page)"
                              disabled={busy}
                              onClick={()=>{
                                if(window.confirm('هل أنت أخير ومحقق من رغبتك في حذف صفحة الهبوط هذه نهائياً؟')){
                                  save({action:'delete_page',id:p.id},'تم حذف صفحة الهبوط نهائياً.');
                                }
                              }}
                              style={{color:'#d32f2f'}}
                            >
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  <button className="newpagecard" onClick={()=>newPage()}>
                    <span><Plus size={26}/></span>
                    <strong>Your next bestseller</strong>
                    <p>Give a new product its own page.</p>
                    <span className="newpagelink">Create landing page</span>
                  </button>
                </div>
              </>
            )}

            {tab==='Orders'&&userPerms.includes('Orders')&&(
              <section className="panel">
                <div className="toolbar ordertoolbar">
                  <div className="search"><Search size={17}/><input aria-label="Search orders" placeholder="Search customer, phone, product…" value={query} onChange={e=>setQuery(e.target.value)}/></div>
                  <div className="toolbarcontrols">
                    <select aria-label="Order status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option>{['new','confirmed','shipped','delivered','cancelled'].map(s=><option key={s}>{s}</option>)}</select>
                    {dateControl}
                  </div>
                </div>
                {orderTable(visibleOrders)}
                <div className="tablefoot">{visibleOrders.length} order{visibleOrders.length!==1?'s':''} · Sales are counted when an order is delivered.</div>
              </section>
            )}

            {tab==='Analytics'&&userPerms.includes('Analytics')&&(
              <>
                <section className="panel"><div className="panelhead"><div><h2>Product performance</h2><p>Compare every landing page in the selected period.</p></div><span className="muted">{pages.length} products</span></div>{performance}</section>
                <div className="infobox"><ChartNoAxesCombined size={22}/><p>Visits count each browser session once per product per day. Administrator previews are excluded. Conversion is placed orders divided by visits; sales include delivered orders only. Dates are recorded in UTC.</p></div>
              </>
            )}

            {tab==='Brand settings'&&userPerms.includes('Brand settings')&&(
              <div>
                <form onSubmit={async e=>{e.preventDefault();const r=await save({action:'brand',brand:branding||b},'Brand updated across every landing page.');if(r)setBranding(null)}}>
                  <div className="settingsgrid">
                    <div>
                      <section className="panel">
                        <div className="panelhead"><div><h2>Brand identity</h2><p>Changes apply to the dashboard and all product pages.</p></div><Globe size={20}/></div>
                        <div className="settingsbody">
                          <label>Brand name<input required maxLength={60} value={(branding||b).name} onChange={e=>setBranding({...branding||b,name:e.target.value})}/></label>
                          <label>Tagline<input maxLength={120} value={(branding||b).tagline} onChange={e=>setBranding({...branding||b,tagline:e.target.value})}/></label>
                          <ImageField label="Global logo" value={(branding||b).logo} onChange={(logo:string)=>setBranding({...branding||b,logo})}/>
                          <label>Brand color<div className="colorinput"><input aria-label="Choose brand color" type="color" value={(branding||b).color} onChange={e=>setBranding({...branding||b,color:e.target.value})}/><input pattern="#[a-fA-F0-9]{6}" value={(branding||b).color} onChange={e=>setBranding({...branding||b,color:e.target.value})}/></div></label>
                          <label>Customer support phone<input value={(branding||b).phone} onChange={e=>setBranding({...branding||b,phone:e.target.value})} placeholder="+212 …"/></label>
                          <label>Meta Facebook Pixel ID<input value={(branding||b).pixelId||'1116296790985534'} onChange={e=>setBranding({...branding||b,pixelId:e.target.value})} placeholder="1116296790985534" dir="ltr"/><small style={{color:'#205b44',fontWeight:'700'}}>Pixel ID: 1116296790985534 مفعّل لتتبع الزيارات والطلبات إعلانات الفيسبوك والانستغرام</small></label>
                          <label>Currency<input value="Moroccan dirham (MAD / DH)" disabled/></label>
                        </div>
                        <div className="panelfoot"><button className="primary" disabled={busy}>{busy?'Saving…':'Save brand settings'}</button></div>
                      </section>
                    </div>
                    <div>
                      <section className="panel brandpreview">
                        <div className="panelhead"><h2>Brand preview</h2></div>
                        <div style={{'--brand':(branding||b).color} as any}>
                          <Logo brand={branding||b}/>
                          <div className="brandpreviewhero"><Leaf size={40}/><h2>Your brand.<br/>Every storefront.</h2><span className="storebutton">Order now</span></div>
                        </div>
                      </section>
                      <div className="infobox"><ShieldCheck size={23}/><p>Only the store administrator can access orders and edit settings. Your site starts private; you can share it when you’re ready.</p></div>
                    </div>
                  </div>
                </form>
                <AdminManager admins={data.admins||[]} onReload={reload} />
              </div>
            )}

            <div className="workspacefooter">
              <span>{b.name} Store Studio</span>
              <span>
                Designed & Developed by{' '}
                <a
                  href="https://www.linkedin.com/in/ayoub-eddarif-b92189b3/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#205b44', fontWeight: '700', textDecoration: 'underline' }}
                >
                  Ayoub Eddarif
                </a>
              </span>
            </div>
          </div>
        )}
      </main>
      {detail&&(
        <div className="modalbackdrop" onClick={()=>setDetail(null)}>
          <section className="modal ordermodal" role="dialog" aria-modal="true" aria-label="Order details" onClick={e=>e.stopPropagation()}>
            <button className="close iconbutton" onClick={()=>setDetail(null)} aria-label="Close"><X size={20}/></button>
            <div className="eyebrow">ORDER #{detail.id.slice(0,8).toUpperCase()}</div>
            <h1>{detail.customer}</h1>
            <p>{niceDate(detail.created_at)}</p>
            <div className="detailgrid">
              <div>
                <h3>Customer details</h3>
                <a
                  href={getWhatsAppUrl(detail.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-chat-btn"
                  style={{ background: '#25D366', color: '#fff', padding: '10px 18px', fontSize: '14px', marginBottom: '12px' }}
                >
                  <MessageCircle size={18} />
                  <span>تواصل واتساب: <strong dir="ltr">{detail.phone}</strong></span>
                </a>
                <p>{detail.address}<br/>{detail.city}</p>
              </div>
              <div>
                <h3>Order summary</h3>
                <p>{detail.product}<br/>{detail.quantity} × {money(detail.unit_price)}<br/>Delivery: {money(detail.shipping)}</p>
                <strong>{money(detail.total)}</strong>
              </div>
            </div>
            {detail.notes&&<div className="infobox"><p>{detail.notes}</p></div>}
            <form onSubmit={async e=>{e.preventDefault();const r=await save({action:'status',id:detail.id,status:detail.status},'Order status updated.');if(r)setDetail(null)}}>
              <label>Order status
                <select value={detail.status} onChange={e=>setDetail({...detail,status:e.target.value})}>
                  {['new','confirmed','shipped','delivered','cancelled'].map(s=><option key={s}>{s}</option>)}
                </select>
              </label>
              <div style={{display:'flex',gap:'12px',marginTop:'18px',justify:'space-between',alignItems:'center'}}>
                <button className="primary" disabled={busy}>{busy?'Saving…':'Update status'}</button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async ()=>{
                    if(window.confirm('Are you sure you want to permanently delete this order?')){
                      const r=await save({action:'delete_order',id:detail.id},'Order deleted successfully.');
                      if(r)setDetail(null);
                    }
                  }}
                  style={{border:0,background:'transparent',color:'#d32f2f',fontWeight:'700',cursor:'pointer',fontSize:'13px',display:'flex',alignItems:'center',gap:'4px'}}
                >
                  <Trash2 size={16}/>
                  Delete Order
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
