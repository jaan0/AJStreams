'use client';
import { useEffect, useState } from 'react';
export default function AnalyticsPreference() {
    const [enabled, setEnabled] = useState(false);
    useEffect(() => { try { setEnabled(localStorage.getItem('ajstreams_analytics_consent') === 'yes'); } catch {} }, []);
    return <section className="rounded-xl border border-white/10 p-5 my-6"><h2 className="font-semibold mb-2">Optional analytics</h2><p className="text-sm text-zinc-400 mb-4">Allow visit statistics and anonymous click coordinates. You can change this preference at any time. Do Not Track and Global Privacy Control take priority.</p><button className="btn-secondary" aria-pressed={enabled} onClick={() => { const next = !enabled; try { localStorage.setItem('ajstreams_analytics_consent', next ? 'yes' : 'no'); setEnabled(next); window.dispatchEvent(new Event('analytics-preference')); } catch {} }}>{enabled ? 'Disable analytics' : 'Enable analytics'}</button></section>;
}
