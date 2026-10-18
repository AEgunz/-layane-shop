'use client';

import {useEffect} from 'react';

const fontUrl = 'https://fonts.googleapis.com/css2?family=Alexandria:wght@400;600;700;800;900&family=Cairo:wght@400;500;600;700;800;900&family=Changa:wght@600;800&family=Tajawal:wght@400;700;800;900&display=swap';

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
