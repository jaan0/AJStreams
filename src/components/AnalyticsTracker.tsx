'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const preference = 'ajstreams_analytics_consent';
export default function AnalyticsTracker() {
    const path = usePathname();
    const [consent, setConsent] = useState<string | null>('pending');
    useEffect(() => {
        const read = () => { try { setConsent(localStorage.getItem(preference)); } catch { setConsent('no'); } };
        read(); window.addEventListener('analytics-preference', read); window.addEventListener('storage', read);
        return () => { window.removeEventListener('analytics-preference', read); window.removeEventListener('storage', read); };
    }, []);
    const choose = (value: string) => { try { localStorage.setItem(preference, value); } catch {} setConsent(value); };
    useEffect(() => {
        if (consent !== 'yes' || path.startsWith('/admin') || navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
        let session: string;
        try {
            const saved = JSON.parse(sessionStorage.getItem('ajstreams_analytics_session') || 'null');
            session = saved && Date.now() - saved.time < 1800000 ? saved.id : crypto.randomUUID();
            sessionStorage.setItem('ajstreams_analytics_session', JSON.stringify({ id: session, time: Date.now() }));
        } catch { session = crypto.randomUUID(); }
        const view = crypto.randomUUID();
        let queue: Record<string, unknown>[] = [], last = Date.now(), scroll = 0, clicks = 0, lastClick = 0;
        let visible = document.visibilityState === 'visible';
        const add = (type: string, extra: Record<string, unknown> = {}) => {
            queue.push({ id: crypto.randomUUID(), view, type, path, width: Math.min(10000, innerWidth), height: Math.min(10000, innerHeight), ...extra });
        };
        const depth = () => { scroll = Math.max(scroll, Math.min(100, Math.round((scrollY + innerHeight) / Math.max(innerHeight, document.documentElement.scrollHeight) * 100))); };
        const flush = () => {
            try { if (localStorage.getItem(preference) !== 'yes') { queue = []; return; } } catch { queue = []; return; }
            if (!queue.length) return;
            const events = queue.splice(0, 25);
            void fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consent: true, session, events }), keepalive: true }).catch(() => {});
        };
        const engagement = () => {
            depth(); const now = Date.now();
            if (visible) add('engagement', { seconds: Math.min(300, (now - last) / 1000), scroll });
            last = now; flush();
            try { if (visible) sessionStorage.setItem('ajstreams_analytics_session', JSON.stringify({ id: session, time: now })); } catch {}
        };
        const visibility = () => { engagement(); visible = document.visibilityState === 'visible'; };
        const click = (event: MouseEvent) => {
            if (!(event.target instanceof Element) || event.target.closest('input,textarea,select,[contenteditable], [data-no-analytics]') || !event.isTrusted || clicks >= 200 || Date.now() - lastClick < 300) return;
            lastClick = Date.now(); clicks++; depth();
            const el = event.target.closest('a,button');
            add('click', { x: Math.min(1, Math.max(0, event.clientX / innerWidth)), y: Math.min(1, Math.max(0, event.clientY / innerHeight)), scroll, target: el?.tagName === 'A' ? 'link' : el?.tagName === 'BUTTON' ? 'button' : 'other' });
            if (queue.length >= 20) flush();
        };
        add('pageview', { referrer: document.referrer ? new URL(document.referrer).origin : '' }); flush();
        const timer = window.setInterval(engagement, 15000);
        document.addEventListener('click', click); document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', engagement);
        return () => { engagement(); clearInterval(timer); document.removeEventListener('click', click); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', engagement); };
    }, [consent, path]);
    if (consent !== null || path.startsWith('/admin')) return null;
    return <aside data-no-analytics className="analytics-consent" aria-label="Analytics preference"><p>Help improve AJStreams with optional visit and click analytics. No form entries or recordings. <Link href="/cookies">Details</Link></p><div><button onClick={() => choose('no')}>No thanks</button><button onClick={() => choose('yes')}>Allow analytics</button></div></aside>;
}
