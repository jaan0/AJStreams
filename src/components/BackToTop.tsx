'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'react-feather';

export default function BackToTop() {
    const path = usePathname();
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const update = () => setVisible(window.scrollY > 300);
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, [path]);
    if (!visible) return null;
    return <button type="button" aria-label="Back to top" title="Back to top" className="back-to-top" onClick={() => {
        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }}><ArrowUp size={24} aria-hidden="true" /></button>;
}
