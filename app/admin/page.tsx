'use client';
import { useState, useEffect } from 'react';
import Studio from '../studio';

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="login-backdrop">
        <div style={{ color: '#205b44', fontWeight: '800', fontSize: '18px', textAlign: 'center' }}>
          <div className="spinner-dots" style={{ justifyContent: 'center', marginBottom: '14px' }}>
            <span /><span /><span />
          </div>
          layane-shop Store Studio
        </div>
      </div>
    );
  }

  return <Studio />;
}
