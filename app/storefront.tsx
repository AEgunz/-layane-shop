'use client';
import {useEffect,useState} from 'react';
import {Leaf,ShieldCheck,Truck,Check,ShoppingBag,X} from 'lucide-react';

export function Logo({brand}:any){
  return (
    <span className="brand">
      {brand.logo ? (
        <img src={brand.logo} alt={brand.name||'logo'} className="brand-logo-img" />
      ) : (
        <>
          <span className="mark"><Leaf size={24}/></span>
          <span>{brand.name}<small>{brand.tagline}</small></span>
        </>
      )}
    </span>
  );
}

export function ProductView({page:p,brand:b,preview=false}:any){
  const ar=p.language==='ar';
  const fr=p.language==='fr';
  const [done,setDone]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [quantity,setQuantity]=useState(1);
  const [id,setId]=useState('');
  const [showSticky,setShowSticky]=useState(true);
  const [activePolicy,setActivePolicy]=useState<any>(null);

  useEffect(()=>setId(crypto.randomUUID()),[]);

  useEffect(() => {
    function handleScroll() {
      const target = document.getElementById('order');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      if (rect.top <= window.innerHeight) {
        setShowSticky(false);
      } else {
        setShowSticky(true);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function openPolicy(key:string){
    const policies:Record<string,{title:string;content:React.ReactNode}>={
      about:{
        title:'عن المتجر',
        content:(
          <div>
            <p>أهلاً بكم في متجرنا! نحن متجر مغربي متخصص في توفير أجود المنتجات عالية الجودة والمختارة بعناية فائقة لعملائنا في كافة مدن المغرب.</p>
            <p>هدفنا الأول هو تقديم تجربة تسوق سهلة، مريحة وآمنة. نوفر لكم خدمة الدفع عند الاستلام والتوصيل السريع مباشرة إلى باب منزلك مع ضمان الجودة والرضا التام.</p>
          </div>
        )
      },
      payment:{
        title:'طرق الدفع',
        content:(
          <div>
            <p>طريقة الدفع المعتمدة في متجرنا هي <strong>الدفع عند الاستلام (Cash on Delivery)</strong>.</p>
            <p>لا تتطلب عملية الشراء أي دفع مسبق أو بطاقة بنكية. تقوم بطلب المنتج عبر ملء استمارة التوصيل، وسيقوم الموزع بإيصال الطلب حتى باب منزلك، حيث يمكنك معاينة طلبك ودفع المبلغ نقداً للموزع.</p>
          </div>
        )
      },
      shipping:{
        title:'الشحن والتسليم',
        content:(
          <div>
            <p>نوفر خدمة التوصيل لكافة المدن والمناطق بالمملكة المغربية.</p>
            <ul>
              <li><strong>مدة التوصيل:</strong> بين 24 إلى 48 ساعة عمل.</li>
              <li><strong>التأكيد:</strong> يتصل بكم فريقنا هاتفياً قبل إرسال الموزع لتأكيد وقت ومكان التسليم المناسب لكم.</li>
              <li><strong>المعاينة:</strong> يحق للزبون التأكد من سلامة الشحنة عند التسليم.</li>
            </ul>
          </div>
        )
      },
      contact:{
        title:'اتصل بنا',
        content:(
          <div>
            <p>فريق خدمة العملاء جاهز للرد على جميع أسئلتكم واستفساراتكم وتتبع طلباتكم طيلة أيام الأسبوع.</p>
            {b.phone&&<p><strong>الهاتف / الواتساب:</strong> <a href={'tel:'+b.phone} dir="ltr">{b.phone}</a></p>}
            <p><strong>ساعات العمل:</strong> من الإثنين إلى السبت (من 9:00 صباحاً حتى 8:00 مساءً).</p>
          </div>
        )
      },
      faq:{
        title:'الأسئلة المتكررة',
        content:(
          <div>
            <h4>1. كيف يمكنني إتمام الطلب؟</h4>
            <p>يكفي كتابة اسمك، رقم هاتفك والمدينة في الاستمارة أعلاه والضغط على زر "اطلب الآن".</p>
            <h4>2. متى سأستلم طلبي؟</h4>
            <p>يصلك الطلب خلال 24 إلى 48 ساعة كحد أقصى مع الاتصال بك قبل التوصيل.</p>
            <h4>3. هل يمكنني معاينة المنتج قبل الدفع؟</h4>
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
    try{
      const res=await fetch('/api/public',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'order',slug:p.slug,id,name:f.get('name'),phone:f.get('phone'),city:f.get('city'),address:f.get('address'),notes:'',quantity,website:f.get('website')||''})
      });
      const data:any=await res.json();
      if(!res.ok)throw new Error(data.error);
      setDone(data.reference)
    }catch(e:any){
      setError(e.message)
    }finally{
      setBusy(false)
    }
  }

  return (
    <div className={'storefront '+p.template} dir={ar?'rtl':'ltr'} style={{'--brand':b.color} as any}>
      <div className="storetop">{ar?'الدفع عند الاستلام • توصيل إلى جميع أنحاء المغرب':fr?'Paiement à la livraison • Livraison au Maroc':'Cash on delivery • Delivery across Morocco'}</div>

      {p.customHtml ? (
        <section className="custom-html-section">
          <div dangerouslySetInnerHTML={{ __html: p.customHtml }} />
        </section>
      ) : p.images && p.images.length > 0 ? (
        <section className="seamless-images-section">
          <div className="seamless-images-wrap">
            {p.images.map((imgUrl: string, idx: number) => (
              <img key={idx} src={imgUrl} alt={p.name} className="seamless-img" />
            ))}
            <div className="banner-cta-bar">
              <div className="banner-cta-text">
                <h4>{ar?'أكمل معلوماتك وسنتصل بك لتأكيد الطلب':fr?'Complétez vos détails et nous vous contacterons':'Fill in your details and we will call you to confirm your order'}</h4>
                <div className="storeprice"><span dir="ltr">{p.price} DH</span> {p.comparePrice>p.price&&<del><span dir="ltr">{p.comparePrice} DH</span></del>}</div>
              </div>
            </div>
          </div>
        </section>
      ) : p.image ? (
        <section className="landing-banner-section">
          <div className="landing-banner-wrap">
            <img src={p.image} alt={p.name} className="landing-banner-img"/>
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

      {p.faq && p.faq.length > 0 && (
        <section className="storefaq">
          <h2>{ar?'أسئلة شائعة':fr?'Questions fréquentes':'A few things you might ask'}</h2>
          {p.faq.map((f:any,i:number)=><details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>)}
        </section>
      )}

      <section id="order" className="ordersection">
        {done?<div className="successbox"><Check size={35}/><h2>{ar?'تم استلام طلبك!':'Your order is received!'}</h2><p>{ar?'رقم الطلب':'Order reference'}: {done}</p><p>{ar?'سنتواصل معك لتأكيد التفاصيل.':'We’ll contact you to confirm the details.'}</p></div>:<form onSubmit={order}>
          <h3>{ar?'معلومات التوصيل':fr?'Détails de livraison':'Delivery details'}</h3>
          <input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder={ar?'الاسم الكامل':'Full name'} dir="rtl"/>
          <input name="phone" type="tel" required pattern="[+0-9 ]{8,25}" autoComplete="tel" placeholder={ar?'رقم الهاتف (0600000000)':'Phone number'} dir="rtl"/>
          <input name="city" required minLength={2} maxLength={100} autoComplete="address-level2" placeholder={ar?'المدينة':'City'} dir="rtl"/>
          <textarea name="address" rows={2} required minLength={3} maxLength={500} autoComplete="street-address" placeholder={ar?'العنوان الكامل (الحي / الشارع / رقم المنزل)':'Full address'} dir="rtl"/>

          <div className="qty-row-centered">
            <span className="qty-row-label">{ar?'الكمية المطلوبة:':'Quantity:'}</span>
            <div className="qty-counter-pills" dir="ltr">
              <button type="button" onClick={()=>setQuantity(Math.max(1,quantity-1))}>-</button>
              <span className="qty-num">{quantity}</span>
              <button type="button" onClick={()=>setQuantity(Math.min(10,quantity+1))}>+</button>
            </div>
          </div>

          <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>
          {error&&<p className="error" role="alert">{error}</p>}
          <button className="storebutton" disabled={busy}>
            {busy?(ar?'جار الإرسال…':'Submitting…'):<>{p.cta||'اطلب الآن'} - <span dir="ltr">{p.price*quantity+p.shipping} DH</span></>}
          </button>
          <small>{ar?'الدفع عند الاستلام والتوصيل إلى باب منزلك':'Cash on delivery • Delivery to your doorstep'}</small>

          {p.reviewsImage && (
            <div className="reviews-image-box">
              <div className="reviews-title">
                <span>⭐⭐⭐⭐⭐</span>
                <h4>{ar ? 'آراء وتقييمات زبنائنا الكرام' : 'Customer Reviews'}</h4>
              </div>
              <img src={p.reviewsImage} alt={ar ? 'آراء الزبناء' : 'Customer Reviews'} className="reviews-img" />
            </div>
          )}
        </form>}
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
            <button type="button" onClick={()=>openPolicy('contact')}>اتصل بنا</button>
            <button type="button" onClick={()=>openPolicy('faq')}>الأسئلة المتكررة</button>
          </div>

          <div className="footer-col">
            <h4>الشروط والسياسات</h4>
            <div className="col-divider"/>
            <button type="button" onClick={()=>openPolicy('terms')}>شروط الاستخدام</button>
            <button type="button" onClick={()=>openPolicy('return')}>سياسة الاستبدال والاسترجاع</button>
            <button type="button" onClick={()=>openPolicy('privacy')}>سياسة الخصوصية</button>
            <button type="button" onClick={()=>openPolicy('cgv')}>شروط وأحكام البيع (CGV)</button>
          </div>
        </div>

        <div className="footer-bottom-copy">
          <Logo brand={b}/>
          <span>© {new Date().getFullYear()} {b.name}. جميع الحقوق محفوظة.</span>
        </div>
      </footer>

      {/* Interactive Policy Popup Modal */}
      {activePolicy && (
        <div className="policy-modal-backdrop" onClick={()=>setActivePolicy(null)}>
          <div className="policy-modal-box" onClick={e=>e.stopPropagation()}>
            <div className="policy-modal-head">
              <h3>{activePolicy.title}</h3>
              <button type="button" className="policy-close-btn" onClick={()=>setActivePolicy(null)}><X size={20}/></button>
            </div>
            <div className="policy-modal-body">
              {activePolicy.content}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Floating Bottom Order Bar */}
      {showSticky && (
        <div className="sticky-bottom-bar">
          <div className="sticky-bar-inner">
            <div className="sticky-price-info">
              <span className="sticky-product-name">{p.name}</span>
              <span className="sticky-price" dir="ltr">{p.price*quantity} DH</span>
            </div>
            <a href="#order" className="storebutton sticky-btn">
              {p.cta||'اطلب الآن'} - <span dir="ltr">{p.price*quantity} DH</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Storefront({slug}:{slug:string}){const [data,setData]=useState<any>(null);const [error,setError]=useState('');useEffect(()=>{fetch('/api/public?slug='+encodeURIComponent(slug)).then(async r=>{const d:any=await r.json();if(!r.ok)throw new Error(d.error);setData(d);document.title=d.page.name+' | '+d.brand.name;let token=sessionStorage.getItem('store-visit');if(!token){token=crypto.randomUUID();sessionStorage.setItem('store-visit',token)}fetch('/api/public',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'visit',slug,token})}).catch(()=>{})}).catch(e=>setError(e.message))},[slug]);if(error)return <div className="loading"><ShoppingBag/><h1>Page unavailable</h1><p>{error}</p></div>;if(!data)return <div className="loading">Loading your storefront…</div>;return <ProductView page={data.page} brand={data.brand}/>}
