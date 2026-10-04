'use client';
import {useState,useEffect,useRef,useId} from 'react';
import {ShoppingBag,Star,ShieldCheck,Truck,RotateCcw,ChevronDown,Check,Plus,Minus,X,Lock,Phone,MapPin,User,Tag,Award,Sparkles,MessageCircle} from 'lucide-react';

const money=(n:number)=>new Intl.NumberFormat('en-MA',{maximumFractionDigits:2}).format(n)+' DH';

export function Logo({brand}:any){
  return (
    <a href="/" className="brandlogo">
      {brand.logo ? (
        <img
          src={brand.logo}
          alt={brand.name || 'layane-shop'}
          className="brandlogo-img"
          style={{ maxHeight: '38px', maxWidth: '140px', objectFit: 'contain', display: 'block' }}
        />
      ) : (
        <>
          <span className="brandicon">{brand.name?.[0]?.toUpperCase() || 'L'}</span>
          <span>{brand.name}</span>
        </>
      )}
    </a>
  );
}

function TrustGuaranteeCards() {
  return (
    <div className="trust-cards-grid">
      <div className="trust-card">
        <div className="trust-card-icon"><Truck size={24}/></div>
        <div>
          <h4>توصيل سريع ومجاني</h4>
          <p>توصيل لجميع المدن المغربية خلال 24 إلى 48 ساعة حتى باب منزلكم</p>
        </div>
      </div>
      <div className="trust-card">
        <div className="trust-card-icon"><RotateCcw size={24}/></div>
        <div>
          <h4>ضمان استبدال 7 أيام</h4>
          <p>استبدال مجاني وفوري في حالة وجود أي عيب أو عطب بالمنتج</p>
        </div>
      </div>
      <div className="trust-card">
        <div className="trust-card-icon"><ShieldCheck size={24}/></div>
        <div>
          <h4>الدفع عند الاستلام</h4>
          <p>لا تدفع شيئاً حتى تستلم طلبك وتتفحصه بنفسك بكل أمان</p>
        </div>
      </div>
    </div>
  );
}

function OrderFormSection({
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
}: any) {
  if (done) {
    return (
      <div id="checkout-form" className="orderbox successbox" style={{ background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '16px', padding: '24px 20px', textAlign: 'center', margin: '30px 0' }}>
        <div style={{ width: '56px', height: '56px', background: '#22c55e', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
          <Check size={32} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#15803d', marginBottom: '8px' }}>
          {ar ? 'تم تسجيل طلبك بنجاح!' : fr ? 'Commande enregistrée avec succès !' : 'Order Placed Successfully!'}
        </h3>
        <p style={{ fontSize: '14px', color: '#166534', marginBottom: '14px' }}>
          {ar ? `رقم المرجع الخاص بطلبك: ` : 'Order Reference: '}
          <strong style={{ background: '#eab308', color: '#000', padding: '3px 10px', borderRadius: '6px', fontSize: '15px' }}>#{done.ref}</strong>
        </p>
        <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.6', marginBottom: '16px' }}>
          {ar ? 'شكراً لثقتكم بـ layane-shop! سيقوم فريق خدمة الزبناء بالاتصال بكم هاتفياً لتأكيد تفاصيل التوصيل وإرسال الشحنة لعنوانكم فوراً.' : 'Thank you for choosing layane-shop! Our team will contact you shortly to confirm your order details.'}
        </p>
      </div>
    );
  }

  const unitPrice = p.price ?? 0;
  const total = unitPrice * quantity + (p.shipping || 0);
  const productName = p.name || '';

  return (
    <div id="checkout-form" className="orderbox animated-orderbox">
      <div className="orderbox-header">
        <h3>{ar ? 'معلومات الطلب والتوصيل (الدفع عند الاستلام)' : 'Order & Shipping Form'}</h3>
        <p>{ar ? 'يرجى ملء الاستمارة أدناه وسيتم التواصل معكم هاتفياً لتأكيد الشحنة' : 'Fill in your details below for Cash on Delivery'}</p>
      </div>

      <form onSubmit={order} autoComplete="on">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} aria-hidden="true" />

        {error && <div className="form-error-alert"><X size={16} />{error}</div>}

        <div className="form-group">
          <label><User size={16} /> {ar ? 'الاسم الكامل' : 'Full Name'} <span className="required">*</span></label>
          <input
            name="name"
            required
            maxLength={120}
            placeholder={ar ? 'مثال: محمد العلوي' : 'e.g. John Doe'}
            value={formState.name}
            onChange={e => setFormState({ ...formState, name: e.target.value })}
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label><Phone size={16} /> {ar ? 'رقم الهاتف' : 'Phone Number'} <span className="required">*</span></label>
          <input
            name="phone"
            type="tel"
            required
            maxLength={25}
            placeholder={ar ? 'مثال: 0612345678' : '0612345678'}
            value={formState.phone}
            onChange={e => setFormState({ ...formState, phone: e.target.value })}
            autoComplete="tel"
            dir="ltr"
          />
        </div>

        <div className="form-group">
          <label><MapPin size={16} /> {ar ? 'المدينة' : 'City'} <span className="required">*</span></label>
          <input
            name="city"
            required
            maxLength={100}
            placeholder={ar ? 'مثال: الدار البيضاء، الرباط…' : 'e.g. Casablanca'}
            value={formState.city}
            onChange={e => setFormState({ ...formState, city: e.target.value })}
            autoComplete="address-level2"
          />
        </div>

        <div className="form-group">
          <label><MapPin size={16} /> {ar ? 'العنوان السكني الكامل' : 'Full Delivery Address'} <span className="required">*</span></label>
          <input
            name="address"
            required
            maxLength={500}
            placeholder={ar ? 'مثال: الحي، الشارع، رقم المنزل، العمارة أو الشقة…' : 'Street name, neighborhood, house/apartment number'}
            value={formState.address}
            onChange={e => setFormState({ ...formState, address: e.target.value })}
            autoComplete="street-address"
          />
        </div>

        <div className="quantity-selection-box">
          <label className="qty-label">{ar ? 'اختر الكمية المطلوبة:' : 'Quantity Options:'}</label>
          <div className="qty-pills">
            {[
              { qty: 1, label: ar ? 'قطعة واحدة' : '1 Piece', badge: '' },
              { qty: 2, label: ar ? 'قطعتين (تخفيض خاص)' : '2 Pieces', badge: ar ? 'الأكثر طلباً 🔥' : 'Most Popular' },
              { qty: 3, label: ar ? '3 قطع (عرض العائلة)' : '3 Pieces', badge: ar ? 'أفضل قيمة 🎁' : 'Best Value' }
            ].map(opt => (
              <button
                type="button"
                key={opt.qty}
                className={`qty-pill ${quantity === opt.qty ? 'active' : ''}`}
                onClick={() => setQuantity(opt.qty)}
              >
                {opt.badge && <span className="pill-badge">{opt.badge}</span>}
                <span className="pill-text">{opt.label}</span>
                <span className="pill-price">{money(unitPrice * opt.qty)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="order-summary-card">
          <div className="summary-row">
            <span>{ar ? 'المنتج:' : 'Product:'}</span>
            <strong>{productName}</strong>
          </div>
          <div className="summary-row">
            <span>{ar ? 'الكمية المختارة:' : 'Quantity:'}</span>
            <strong>{quantity} {ar ? 'قطعة' : 'pc'}</strong>
          </div>
          <div className="summary-row">
            <span>{ar ? 'مصاريف التوصيل:' : 'Shipping:'}</span>
            <strong style={{ color: '#16a34a' }}>{p.shipping ? money(p.shipping) : (ar ? 'توصيل مجاني 🚚' : 'Free Shipping')}</strong>
          </div>
          <div className="summary-row total-row">
            <span>{ar ? 'المجموع النهائي:' : 'Total Amount:'}</span>
            <strong className="final-price">{money(total)}</strong>
          </div>
        </div>

        <button type="submit" className="submit-order-button" disabled={busy}>
          <span className="button-pulse-glow" />
          <ShoppingBag size={22} />
          {busy ? (ar ? 'جار إرسال الطلب…' : 'Processing…') : (p.cta || (ar ? 'اضغط هنا للطلب والدفع عند الاستلام' : 'Confirm Order'))}
        </button>

        <div className="security-badges">
          <span><Lock size={14} /> {ar ? 'معلوماتك مشفرة وآمنة 100%' : '100% Encrypted & Secure'}</span>
          <span><ShieldCheck size={14} /> {ar ? 'الدفع نقداً بعد المعاينة عند الاستلام' : 'Cash on Delivery'}</span>
        </div>
      </form>
    </div>
  );
}

export function ProductView({page,brand,preview}:any){
  const [done,setDone]=useState<any>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [quantity,setQuantity]=useState(1);
  const [formState,setFormState]=useState({ name: '', phone: '', city: '', address: '' });
  const [activePolicy,setActivePolicy]=useState<any>(null);
  const policyDialog = useRef<HTMLDialogElement>(null);
  const policyTitleId = useId();

  useEffect(() => {
    if (!activePolicy) return;
    const dialog = policyDialog.current;
    if (!dialog) return;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus({preventScroll: true});
    };
  }, [activePolicy]);
  const [id]=useState(()=>crypto.randomUUID());

  const p=page || {};
  const ar=p.language==='ar'||!p.language;
  const fr=p.language==='fr';
  const productName = p.name || '';

  const hasUploadedImages = Array.isArray(p.images) && p.images.length > 0;
  const firstImage = hasUploadedImages ? p.images[0] : (p.image || '');
  const remainingImages = hasUploadedImages ? p.images.slice(1) : [];
  const reviewsBannerImage = p.reviewsImage || '';

  useEffect(() => {
    const pixelId = brand?.pixelId || '1116296790985534';
    if (typeof window !== 'undefined' && pixelId) {
      if (!(window as any).fbq) {
        const f = window as any;
        const b = document;
        const e = 'script';
        const v = 'https://connect.facebook.net/en_US/fbevents.js';
        let n: any = (f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        });
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        const t = b.createElement(e) as HTMLScriptElement;
        t.async = !0;
        t.src = v;
        const s = b.getElementsByTagName(e)[0];
        s.parentNode?.insertBefore(t, s);
      }
      try {
        (window as any).fbq('init', pixelId);
        (window as any).fbq('track', 'PageView');
        if (productName) {
          (window as any).fbq('track', 'ViewContent', {
            content_name: productName,
            value: p.price ?? 0,
            currency: 'MAD'
          });
        }
      } catch {}
    }
  }, [brand?.pixelId, p, productName]);

  function scrollToCheckout() {
    const el = document.getElementById('checkout-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function openPolicyModal(key:string){
    const policies:any={
      returns:{
        title:'سياسة الإرجاع والاستبدال',
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
    const totalAmount = (p.price ?? 0) * quantity + (p.shipping || 0);

    try{
      const res=await fetch('/api/public',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          action:'order',
          slug:p.slug,
          price:p.price,
          shipping:p.shipping,
          productName,
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

      if (typeof window !== 'undefined' && (window as any).fbq) {
        try {
          (window as any).fbq('track', 'Purchase', {
            value: totalAmount,
            currency: 'MAD',
            content_name: productName,
            num_items: quantity
          });
          (window as any).fbq('track', 'Lead', {
            content_name: productName,
            value: totalAmount,
            currency: 'MAD'
          });
        } catch {}
      }
    }catch(e:any){
      setError(e.message)
    }finally{
      setBusy(false)
    }
  }

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
    p: { ...p, name: productName }
  };

  return (
    <div className={`storefront-wrapper ${ar ? 'rtl-dir' : 'ltr-dir'}`} dir={ar ? 'rtl' : 'ltr'}>
      {p.customHtml ? (
        <div className="custom-html-landing" dangerouslySetInnerHTML={{ __html: p.customHtml }} />
      ) : (
        <main className="storefront-main">
          <section className="hero-landing-section">
            <div className="product-title-badge">
              <span className="badge-flame">🔥</span>
              <span>{ar ? 'المنتج الأكثر طلباً وشهرة بالمغرب' : 'Best Selling Product'}</span>
            </div>

            <h1 className="landing-title">{productName}</h1>

            {p.headline && <p className="landing-headline">{p.headline}</p>}

            <div className="price-tag-wrapper">
              <span className="current-price">{money(p.price ?? 0)}</span>
              {p.comparePrice > (p.price ?? 0) && (
                <span className="old-price">{money(p.comparePrice)}</span>
              )}
              <span className="free-shipping-badge">
                {p.shipping ? `توصيل: ${money(p.shipping)}` : (ar ? 'توصيل مجاني 🚚' : 'Free Shipping')}
              </span>
            </div>

            {firstImage && (
              <div className="main-banner-image-wrap">
                <img
                  src={firstImage}
                  alt={productName}
                  className="main-banner-image"
                  fetchPriority="high"
                  loading="eager"
                  decoding="sync"
                />
              </div>
            )}
          </section>

          <OrderFormSection {...formProps} />

          {remainingImages.length > 0 && (
            <section className="additional-images-grid">
              {remainingImages.map((imgUrl: string, idx: number) => (
                <div key={idx} className="secondary-banner-image-wrap">
                  <img
                    src={imgUrl}
                    alt={`${productName} - image ${idx + 2}`}
                    className="secondary-banner-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </section>
          )}

          {p.description && (
            <section className="product-description-card">
              <h3>{ar ? 'تفاصيل ومميزات المنتج' : 'Product Details'}</h3>
              <p>{p.description}</p>
            </section>
          )}

          {p.benefits && (
            <section className="product-benefits-card">
              <h3>{ar ? 'لماذا يفضل زبناؤنا هذا المنتج؟' : 'Why Choose Us?'}</h3>
              <div className="benefits-list">
                {p.benefits.split('\n').filter((b: string) => b.trim()).map((b: string, i: number) => (
                  <div key={i} className="benefit-item">
                    <Check size={18} className="check-icon" />
                    <span>{b.trim()}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <OrderFormSection {...formProps} />

          {reviewsBannerImage && (
            <section className="reviews-image-card">
              <h3>{ar ? 'آراء وتقييمات زبنائنا الكرام ⭐' : 'Customer Reviews & Feedback'}</h3>
              <div className="reviews-banner-wrap">
                <img src={reviewsBannerImage} alt="Customer Reviews" className="reviews-banner-image" loading="lazy" />
              </div>
            </section>
          )}

          <TrustGuaranteeCards />
        </main>
      )}

      <div className="sticky-cta-bar">
        <div className="sticky-cta-inner">
          <div className="sticky-price-info">
            <span className="sticky-title">{productName}</span>
            <span className="sticky-price">{money(p.price ?? 0)}</span>
          </div>
          <button className="sticky-cta-button" onClick={scrollToCheckout}>
            <ShoppingBag size={18} />
            <span>{p.cta || (ar ? 'اطلب الآن' : 'Order Now')}</span>
          </button>
        </div>
      </div>

      <footer className="storefront-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} <span dir="ltr">{brand.name || 'layane-shop'}</span>. {ar ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}</p>
          <div className="footer-links">
            <button type="button" onClick={() => openPolicyModal('returns')}>{ar ? 'سياسة الإرجاع والاستبدال' : 'Returns'}</button>
            <button type="button" onClick={() => openPolicyModal('privacy')}>{ar ? 'سياسة الخصوصية' : 'Privacy Policy'}</button>
            <button type="button" onClick={() => openPolicyModal('cgv')}>{ar ? 'شروط البيع (CGV)' : 'Terms of Sale'}</button>
          </div>
          <div className="developer-signature">
            Designed & Developed by{' '}
            <a
              href="https://www.linkedin.com/in/ayoub-eddarif-b92189b3/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ayoub Eddarif
            </a>
          </div>
        </div>
      </footer>

      {activePolicy && (
        <dialog ref={policyDialog} className="policy-modal-dialog" aria-labelledby={policyTitleId}
          onCancel={() => setActivePolicy(null)}
          onClose={e => { if (!e.currentTarget.open) setActivePolicy(null); }}
          onClick={e => { if (e.target === e.currentTarget) setActivePolicy(null); }}>
          <div className="policy-modal-card">
            <div className="policy-modal-header">
              <h3 id={policyTitleId}>{activePolicy.title}</h3>
              <button type="button" autoFocus onClick={() => setActivePolicy(null)} aria-label="إغلاق"><X size={20} /></button>
            </div>
            <div className="policy-modal-body">
              {activePolicy.content}
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

export default function Storefront({page,brand}:any){
  return <ProductView page={page} brand={brand}/>;
}
