'use client';

import {useEffect} from 'react';

// The store remains readable with its existing fallback fonts while these load.
const fontUrl = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap';

export default function StoreFonts() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, []);

  return <noscript><link rel="stylesheet" href={fontUrl} /></noscript>;
}
