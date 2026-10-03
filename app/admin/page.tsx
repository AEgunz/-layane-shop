'use client';
import dynamic from 'next/dynamic';

const Studio = dynamic(() => import('../studio'), {
  ssr: false,
  loading: () => (
    <div className="login-backdrop">
      <div style={{ color: '#205b44', fontWeight: '800', fontSize: '18px', textAlign: 'center' }}>
        <div className="spinner-dots" style={{ justifyContent: 'center', marginBottom: '14px' }}>
          <span /><span /><span />
        </div>
        layane-shop Store Studio
      </div>
    </div>
  )
});

export default function AdminPage() {
  return <Studio />;
}
