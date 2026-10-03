'use client';
import {useState,useEffect} from 'react';
import {ShoppingBag,Truck,ShieldCheck,Check,Globe,Package,RefreshCw,MessageCircle,Leaf,ChevronRight,X} from 'lucide-react';

export function Logo({brand}:{brand:any}){
  return (
    <div className="brandlogo" style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '200px', overflow: 'hidden' }}>
      {brand.logo ? (
        <img
          src={brand.logo}
          alt={brand.name}
          className="brandlogo-img"
          style={{ maxHeight: '38px', maxWidth: '150px', objectFit: 'contain', width: 'auto', height: 'auto', display: 'block' }}
        />
      ) : (
        <span className="logoicon"><Leaf size={22}/></span>
      )}
      {!brand.logo && (
        <div>
          <strong>{brand.name}</strong>
          <small>{brand.tagline}</small>
        </div>
      )}
    </div>
  );
}

function OrderFormSection({ sectionId, done, formState, setFormState, quantity, setQuantity, order, busy, error, ar, fr, p }: any) {
  const refCode = typeof done === 'object' ? (done as any).ref : done;
  const whatsappUrl = typeof done === 'object' ? (done as any).whatsappUrl : '';

  return (
    <section id={sectionId} className="ordersection" style={{ margin: '20px auto' }}>
      {done ? (
        <div className="successbox" style={{ textAlign: 'center', padding: '35px 20px' }}>
          <Check size={40} style={{ color: '#205b44', margin: '0 auto 12px auto' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#205b44', margin: '0 0 10px 0' }}>
            {ar ? 'تم استلام طلبك بنجاح!' : 'Your order is received!'}
          </h2>
          <p style={{ fontSize: '15px', color: '#444', marginBottom: '6px' }}>
            {ar ? 'الرقم المرجعي للطلب' : 'Order reference'}: <strong style={{ color: '#205b44' }}>#{refCode}</strong>
          </p>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            {ar ? 'سنتواصل معك هاتفياً لتأكيد التفاصيل والتوصيل.' : 'We will contact you shortly.'}
          </p>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="storebutton"
              style={{
                background: '#25D366',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '800',
                borderRadius: '30px',
                boxShadow: '0 6px 20px rgba(37,211,102,0.35)',
                margin: '10px auto 0 auto'
              }}
            >
              <MessageCircle size={18} />
              {ar ? 'إرسال تفاصيل الطلب عبر الواتساب (WhatsApp)' : 'Send Order Alert on WhatsApp'}
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={order}>
          <h3>{ar ? 'معلومات التوصيل' : fr ? 'Détails de livraison' : 'Delivery details'}</h3>
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder={ar ? 'الاسم الكامل' : 'Full name'}
            dir="rtl"
            value={formState.name}
            onChange={e => setFormState({ ...formState, name: e.target.value })}
          />
          <input
            name="phone"
            type="tel"
            required
            pattern="[+0-9 ]{8,25}"
            autoComplete="tel"
            placeholder={ar ? 'رقم الهاتف (0600000000)' : 'Phone number'}
            dir="rtl"
            value={formState.phone}
            onChange={e => setFormState({ ...formState, phone: e.target.value })}
          />
          <input
            name="city"
            required
            minLength={2}
            maxLength={100}
            autoComplete="address-level2"
            placeholder={ar ? 'المدينة' : 'City'}
            dir="rtl"
            value={formState.city}
            onChange={e => setFormState({ ...formState, city: e.target.value })}
          />
          <textarea
            name="address"
            rows={2}
            required
            minLength={3}
            maxLength={500}
            autoComplete="street-address"
            placeholder={ar ? 'العنوان الكامل (الحي / الشارع / رقم المنزل)' : 'Full address'}
            dir="rtl"
            value={formState.address}
            onChange={e => setFormState({ ...formState, address: e.target.value })}
          />

          <div className="qty-row-centered">
            <span className="qty-row-label">{ar ? 'الكمية المطلوبة:' : 'Quantity:'}</span>
            <div className="qty-counter-pills" dir="ltr">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span className="qty-num">{quantity}</span>
              <button type="button" onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
            </div>
          </div>

          <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="storebutton" disabled={busy}>
            {busy ? (ar ? 'جار الإرسال…' : 'Submitting…') : <>{p.cta || 'اطلب الآن'} - <span dir="ltr">{p.price * quantity + p.shipping} DH</span></>}
          </button>
          <small>{ar ? 'الدفع عند الاستلام والتوصيل إلى باب منزلك' : 'Cash on delivery • Delivery to your doorstep'}</small>
        </form>
      )}
    </section>
  );
}

export function ProductView({page:p,brand:b,preview}:any){
  const [quantity,setQuantity]=useState(1);
  const [formState,setFormState]=useState({name:'',phone:'',city:'',address:''});
  const [done,setDone]=useState<any>('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [activePolicy,setActivePolicy]=useState<{title:string,content:React.ReactNode}|null>(null);
  const ar=p.language!=='en'&&p.language!=='fr';
  const fr=p.language==='fr';
  const id=crypto.randomUUID();

  useEffect(() => {
    if (preview) return;
    let token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('store-visit') : null;
    if (!token) {
      token = crypto.randomUUID();
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('store-visit', token);
    }
    fetch('/api/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'visit', slug: p.slug, token })
    }).catch(() => {});
  }, [p.slug, preview]);

  function openPolicy(key:string){
    const policies:Record<string,{title:string,content:React.ReactNode}> = {
      about:{
        title:'عن المتجر',
        content:(
          <div>
            <p>مرحباً بكم في متجرنا الرسمي! نحن متجر مغربي متألق نهدف لتقديم أجود المنتجات المختارة بعناية فائقة لتلبية تطلعات زبنائنا الكرام في كافة المدن المغربية.</p>
            <p>نلتزم بأعلى معايير الجودة، السرعة، والشفافية مع تقديم خدمة توصيل سريعة والدفع عند الاستلام مع إمكانية المعاينة قبل الدفع.</p>
          </div>
        )
      },
      payment:{
        title:'طرق الدفع',
        content:(
          <div>
            <p>نوفر لكم أسهل وأأمن طريقة تسوق في المغرب:</p>
            <ul>
              <li><strong>الدفع عند الاستلام (Cash on Delivery):</strong> لا تدفع أي درهم حتى يصلك المنتج إلى باب منزلك أو مقر عملك وتعاينه بنفسك!</li>
            </ul>
          </div>
        )
      },
      shipping:{
        title:'الشحن والتسليم',
        content:(
          <div>
            <p>نغطي جميع المدن والمناطق المغربية عبر شبكة موزعين محترفين:</p>
            <h4>1. كم يستغرق التوصيل؟</h4>
            <p>يصلك الطلب خلال 24 إلى 48 ساعة كحد أقصى مع الاتصال بك قبل التوصيل.</p>
            <h4>2. هل يمكنني معاينة المنتج قبل الدفع؟</h4>
            <p>نعم بالتأكيد! يمكنك فحص المنتج ومعاينته عند وصول الموزع قبل تسليم المبلغ.</p>
          </div>
        )
      },
      terms:{
        title:'شروط الاستخدام',
        content:(
          <div>
            <p>مرحباً بكم في متجرنا. بدخولك واستخدامك لموقعنا، فإنك توافق على الالتزام بالشروط والأحكام التالية:</p>
            <p>- جميع المعلومات والأسعار المعروضة دقيقة ومحدثة.</p>
            <p>- يلتزم الزبون بتقديم معلومات توصيل صحيحة (الاسم، الهاتف، المدينة) لضمان وصول الطلب بنجاح.</p>
            <p>- يحق للمتجر إغلاق الطلبات غير المؤكدة هاتفياً.</p>
          </div>
        )
      },
      return:{
        title:'سياسة الاستبدال والاسترجاع',
        content:(
          <div>
            <p>رضاكم هو أولويتنا المطلقة! نوفر سياسة استبدال واسترجاع مرنة خلال <strong>7 أيام</strong> من تاريخ استلام الطلب:</p>
            <ul>
              <li>إذا كان المنتج يحتوي على أي عيب تصنيعي أو عطب، يتم استبداله مجاناً بدون أي مصاريف إضافية.</li>
              <li>يرجى الحفاظ على المنتج في غلافه الأصلي والتواصل معنا عبر الواتساب لمعالجة طلبكم فوراً.</li>
            </ul>
          </div>
        )
      },
      privacy:{
        title:'سياسة الخصوصية',
        content:(
          <div>
            <p>نحن نولي أهمية قصوى لحماية خصوصيتك وبياناتك الشخصية:</p>
            <p>- البيانات المجمعة (الاسم، الهاتف، العنوان) تُستخدم حصرياً لمعالجة وتأكيد وتوصيل طلبك.</p>
            <p>- نضمن عدم مشاركة أو بيع بياناتك الشخصية لأي طرف ثالث تحت أي ظرف.</p>
          </div>
        )
      },
      cgv:{
        title:'شروط وأحكام البيع (CGV)',
        content:(
          <div>
            <p>تحدد هذه الشروط العامة للبيع القواعد القانونية والتجارية للمشتريات عبر الموقع:</p>
            <p>- الأسعار المعروضة مقدرة بالدرهم المغربي (MAD).</p>
            <p>- يتم إبرام عقد البيع نهائياً فور تأكيد الطلب هاتفياً مع الزبون واستلام المنتج.</p>
          </div>
        )
      }
    };
    setActivePolicy(policies[key]||null);
  }

  async function order(e:any){
    e.preventDefault();
    if(preview){setError('Preview mode — publish the page to accept orders.');return}
    setBusy(true);
    setError('');
    const f=new FormData(e.currentTarget);
    const nameVal = String(f.get('name') || formState.name);
    const phoneVal = String(f.get('phone') || formState.phone);
    const cityVal = String(f.get('city') || formState.city);
    const addressVal = String(f.get('address') || formState.address);

    try{
      const res=await fetch('/api/public',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          action:'order',
          slug:p.slug,
          price:p.price,
          shipping:p.shipping,
          productName:p.name,
          id,
          name:nameVal,
          phone:phoneVal,
          city:cityVal,
          address:addressVal,
          notes:'',
          quantity,
          website:f.get('website')||''
        })
      });
      const data:any=await res.json();
      if(!res.ok)throw new Error(data.error);
      setDone({ ref: data.reference, whatsappUrl: data.whatsappUrl });
    }catch(e:any){
      setError(e.message)
    }finally{
      setBusy(false)
    }
  }

  const firstImage = p.images && p.images.length > 0 ? p.images[0] : p.image;
  const remainingImages = p.images && p.images.length > 1 ? p.images.slice(1) : [];

  const formProps = {
    done,
    formState,
    setFormState,
    quantity,
    setQuantity,
    order,
    busy,
    error,
    ar,
    fr,
    p
  };

  return (
    <div className={'storefront '+p.template} dir={ar?'rtl':'ltr'} style={{'--brand':b.color} as any}>
      <div className="storetop">{ar?'الدفع عند الاستلام • توصيل إلى جميع أنحاء المغرب':fr?'Paiement à la livraison • Livraison au Maroc':'Cash on delivery • Delivery across Morocco'}</div>

      {/* 1. FIRST LANDING PAGE BANNER IMAGE */}
      {p.customHtml ? (
        <section className="custom-html-section">
          <div dangerouslySetInnerHTML={{ __html: p.customHtml }} />
        </section>
      ) : firstImage ? (
        <section className="landing-banner-section">
          <div className="landing-banner-wrap">
            <img src={firstImage} alt={p.name} className="landing-banner-img"/>
            <div className="banner-cta-bar">
              <div className="banner-cta-text">
                <h4>{ar?'أكمل معلوماتك وسنتصل بك لتأكيد الطلب':fr?'Complétez vos détails et nous vous contacterons':'Fill in your details and we will call you to confirm your order'}</h4>
                <div className="storeprice"><span dir="ltr">{p.price} DH</span> {p.comparePrice>p.price&&<del><span dir="ltr">{p.comparePrice} DH</span></del>}</div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="hero">
          <div className="heroimage"><ShoppingBag size={90}/></div>
          <div className="herocopy">
            <span className="storeeyebrow">{b.name} / {ar?'العناية اليومية':'EVERYDAY ESSENTIALS'}</span>
            <h1>{p.headline||p.name}</h1>
            <p>{p.description}</p>
            <div className="storeprice"><span dir="ltr">{p.price} DH</span> {p.comparePrice>p.price&&<del><span dir="ltr">{p.comparePrice} DH</span></del>}</div>
            {p.benefits&&<ul>{p.benefits.split('\n').filter(Boolean).map((s:string,i:number)=><li key={i}><Check size={18}/>{s}</li>)}</ul>}
            <a className="storebutton" href="#order">{p.cta||'اطلب الآن'} - <span dir="ltr">{p.price} DH</span> <ShoppingBag size={18}/></a>
            <div className="assurance"><Truck size={18}/>{p.shipping===0?(ar?'توصيل مجاني':'Free delivery'):<><span dir="ltr">{p.shipping} DH</span> {ar?'توصيل':'delivery'}</>}<ShieldCheck size={18}/>{ar?'الدفع عند الاستلام':'Pay on delivery'}</div>
          </div>
        </section>
      )}

      {/* 2. FIRST COD ORDER FORM: معلومات التوصيل 1 */}
      <OrderFormSection sectionId="order" {...formProps} />

      {/* 3. LANDING PAGE IMAGES 2, 3, 4, 5 */}
      {remainingImages.length > 0 && (
        <section className="seamless-images-section">
          <div className="seamless-images-wrap">
            {remainingImages.map((imgUrl: string, idx: number) => (
              <img key={idx} src={imgUrl} alt={`${p.name} ${idx + 2}`} className="seamless-img" />
            ))}
          </div>
        </section>
      )}

      {/* 4. SECOND COD ORDER FORM: معلومات التوصيل 2 */}
      <OrderFormSection sectionId="order2" {...formProps} />

      {/* 5. CUSTOMER REVIEWS: أراء زبنائنا */}
      <section className="reviews-section" style={{ padding: '20px 15px', maxWidth: '650px', margin: '20px auto' }}>
        <div className="reviews-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '22px' }}>⭐⭐⭐⭐⭐</span>
          <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#205b44', marginTop: '6px' }}>
            {ar ? 'أراء وتقييمات زبنائنا الكرام' : 'Customer Reviews'}
          </h3>
        </div>
        {p.reviewsImage ? (
          <div className="reviews-image-box">
            <img src={p.reviewsImage} alt={ar ? 'آراء الزبناء' : 'Customer Reviews'} className="reviews-img" style={{ width: '100%', borderRadius: '12px', border: '1px solid #e1e9df' }} />
          </div>
        ) : (
          <div className="reviews-grid" style={{ display: 'grid', gap: '12px' }}>
            <div className="review-card" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e1e9df', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ color: '#205b44' }}>أيوب - الدار البيضاء</strong>
                <span>⭐⭐⭐⭐⭐</span>
              </div>
              <p style={{ fontSize: '13px', color: '#444', margin: 0, lineHeight: '1.5' }}>"منتج ممتاز جداً والتوصيل كان سريعاً في أقل من 24 ساعة. شكراً جزيلاً!"</p>
            </div>
            <div className="review-card" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e1e9df', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ color: '#205b44' }}>فاطمة الزهراء - الرباط</strong>
                <span>⭐⭐⭐⭐⭐</span>
              </div>
              <p style={{ fontSize: '13px', color: '#444', margin: 0, lineHeight: '1.5' }}>"الجودة ممتازة والمعاينة قبل الدفع أعطتني ثقة كبيرة. سأكرر الشراء بكل تأكيد."</p>
            </div>
          </div>
        )}
      </section>

      {/* FAQ Section */}
      {p.faq && p.faq.length > 0 && (
        <section className="storefaq">
          <h2>{ar?'أسئلة شائعة':fr?'Questions fréquentes':'A few things you might ask'}</h2>
          {p.faq.map((f:any,i:number)=><details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>
      )}

      {/* Trust Guarantees Section */}
      <section className="store-guarantees-section">
        <div className="guarantees-container">
          <div className="guarantee-card card-green">
            <div className="guarantee-icon"><Leaf size={24}/></div>
            <div className="guarantee-divider"/>
            <div className="guarantee-text">
              <h4>جميع المنتجات طبيعية أصيلة 100%</h4>
              <p>منتجات مختارة بعناية للحفاظ على الجودة والأصالة.</p>
            </div>
          </div>

          <div className="guarantee-card card-gold">
            <div className="guarantee-icon"><Package size={24}/></div>
            <div className="guarantee-divider"/>
            <div className="guarantee-text">
              <h4>المنتجات تصلك كما تظهر في الصفحة</h4>
              <p>ما تشاهده في هذه الصفحة هو ما سيصلك داخل طلبيتك.</p>
            </div>
          </div>

          <div className="guarantee-card card-blue">
            <div className="guarantee-icon"><RefreshCw size={24}/></div>
            <div className="guarantee-divider"/>
            <div className="guarantee-text">
              <h4>يمكنك إرجاع أو استبدال الطلبية</h4>
              <p>يمكنك إرجاع أو استبدال طلبيتك بعد الشراء بدون أي شروط.</p>
            </div>
          </div>

          <div className="guarantee-card card-purple">
            <div className="guarantee-icon"><MessageCircle size={24}/></div>
            <div className="guarantee-divider"/>
            <div className="guarantee-text">
              <h4>خدمة ما بعد البيع متوفرة</h4>
              <p>نحن متوفرون لمساعدتك ومتابعة طلبك حتى بعد استلام المنتجات.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rich Store Footer */}
      <footer className="store-rich-footer">
        <div className="footer-cols">
          <div className="footer-col">
            <h4>عن المتجر</h4>
            <div className="col-divider"/>
            <button type="button" onClick={()=>openPolicy('about')}>عن المتجر</button>
            <button type="button" onClick={()=>openPolicy('payment')}>طرق الدفع</button>
            <button type="button" onClick={()=>openPolicy('shipping')}>الشحن والتسليم</button>
          </div>

          <div className="footer-col">
            <h4>اتصل بنا</h4>
            <div className="col-divider"/>
            {b.phone&&<p>الهاتف / الواتساب: <span dir="ltr">{b.phone}</span></p>}
            <p>ساعات العمل: من الإثنين إلى السبت (9 صباحاً - 8 مساءً)</p>
          </div>

          <div className="footer-col">
            <h4>الخصوصية والشروط</h4>
            <div className="col-divider"/>
            <button type="button" onClick={()=>openPolicy('terms')}>شروط الاستخدام</button>
            <button type="button" onClick={()=>openPolicy('privacy')}>سياسة الخصوصية</button>
            <button type="button" onClick={()=>openPolicy('return')}>سياسة الاستبدال والاسترجاع</button>
            <button type="button" onClick={()=>openPolicy('cgv')}>شروط وأحكام البيع (CGV)</button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>{b.name} © {new Date().getFullYear()} — جميع الحقوق محفوظة</span>
          <span className="dev-signature">
            Designed & Developed by{' '}
            <a href="https://www.linkedin.com/in/ayoub-eddarif-b92189b3/" target="_blank" rel="noopener noreferrer">
              Ayoub Eddarif
            </a>
          </span>
        </div>
      </footer>

      {/* Policy Modal Popup */}
      {activePolicy && (
        <div className="policy-modal-backdrop" onClick={()=>setActivePolicy(null)}>
          <div className="policy-modal-content" onClick={e=>e.stopPropagation()} dir="rtl">
            <div className="policy-modal-header">
              <h3>{activePolicy.title}</h3>
              <button type="button" onClick={()=>setActivePolicy(null)} aria-label="Close"><X size={20}/></button>
            </div>
            <div className="policy-modal-body">
              {activePolicy.content}
            </div>
            <div className="policy-modal-footer">
              <button type="button" className="storebutton" onClick={()=>setActivePolicy(null)}>حسناً، فهمت</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Storefront({slug, page, brand}:any){
  const [data,setData]=useState<any>(page && brand ? {page, brand} : null);

  useEffect(()=>{
    if (!page || !brand) {
      fetch(`/api/public${slug?`?slug=${encodeURIComponent(slug)}`:''}`)
        .then(r=>r.json())
        .then(setData)
        .catch(()=>{});
    }
  },[slug, page, brand]);

  if(!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8faf7' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <img
            src="/logo.png"
            alt="layane-shop Logo"
            style={{
              maxHeight: '80px',
              maxWidth: '240px',
              objectFit: 'contain',
              animation: 'logoPulse 1.8s infinite ease-in-out'
            }}
          />
          <div className="spinner-dots" style={{ marginTop: '8px' }}>
            <span />
            <span />
            <span />
          </div>
          <p className="loading-text" style={{ margin: 0 }}>جار التحميل…</p>
        </div>
      </div>
    );
  }

  return <ProductView page={data.page} brand={data.brand}/>;
}
