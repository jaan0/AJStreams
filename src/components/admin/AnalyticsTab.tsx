'use client';
import { useEffect, useState } from 'react';

type Row = { _id: string; count: number };
type Report = {
    totals: { sessions: number; views: number; seconds: number; clicks: number }[];
    daily: Row[]; pages: Row[]; countries: Row[]; cities: Row[]; referrers: Row[];
    devices: Row[]; browsers: Row[]; systems: Row[]; paths: { _id: string }[];
    heat: { _id: { x: number; y: number }; count: number }[];
    depth: { average: number; views: number }[]; geoEnabled: boolean;
};
function Breakdown({ title, rows }: { title: string; rows: Row[] }) {
    const max = Math.max(1, ...rows.map(r => r.count));
    return <section className="analytics-panel"><h3>{title}</h3>{!rows.length && <p className="text-zinc-500 text-sm">No visits yet.</p>}<ol className="space-y-3">{rows.map(row => <li key={row._id}><div className="flex justify-between gap-4 text-sm mb-1"><span className="break-all">{row._id || 'Unknown'}</span><strong>{row.count.toLocaleString()}</strong></div><div className="h-1 rounded bg-white/5"><div className="h-1 rounded bg-slate-400" style={{ width: `${row.count / max * 100}%` }} /></div></li>)}</ol></section>;
}
export default function AnalyticsTab() {
    const [days, setDays] = useState('7'), [path, setPath] = useState('/'), [device, setDevice] = useState('Mobile');
    const [data, setData] = useState<Report | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [refresh, setRefresh] = useState(0);
    useEffect(() => {
        const controller = new AbortController(); setLoading(true); setError('');
        fetch(`/api/admin/analytics?${new URLSearchParams({ days, path, device })}`, { signal: controller.signal, cache: 'no-store' })
            .then(async res => { if (!res.ok) throw new Error('Analytics could not load. Please retry.'); return res.json(); })
            .then(setData).catch(err => { if (err.name !== 'AbortError') setError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [days, path, device, refresh]);
    const totals = data?.totals[0];
    const maxHeat = Math.max(1, ...(data?.heat || []).map(p => p.count));
    const dates = Array.from({ length: Number(days) + 1 }, (_, i) => new Date(Date.now() - (Number(days) - i) * 86400000).toISOString().slice(0, 10));
    const maxDay = Math.max(1, ...(data?.daily || []).map(r => r.count));
    return <div className="analytics-dashboard">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">Audience & engagement</h2><p className="text-zinc-400 text-sm mt-2">Consenting visits only. Sessions are browser-tab visits, not identified people.</p></div><div className="flex gap-2"><select aria-label="Analytics date range" value={days} onChange={e => setDays(e.target.value)}>{[1, 7, 30, 90].map(d => <option key={d} value={d}>Last {d} {d === 1 ? 'day' : 'days'}</option>)}</select><button className="btn-secondary" onClick={() => setRefresh(v => v + 1)}>Refresh</button></div></div>
        {loading && <p role="status" className="text-zinc-400">Loading analytics…</p>}
        {error && <p role="alert" className="text-red-300">{error}</p>}
        {!error && data && <>
            <div className="analytics-metrics">{[['Page views', totals?.views || 0], ['Sessions', totals?.sessions || 0], ['Recorded clicks', totals?.clicks || 0], ['Avg. visible time / session', `${Math.round((totals?.seconds || 0) / Math.max(1, totals?.sessions || 0))}s`]].map(([label, value]) => <section className="analytics-panel" key={label}><p className="text-sm text-zinc-400">{label}</p><strong className="text-3xl block mt-3">{value.toLocaleString()}</strong></section>)}</div>
            {!totals && <div className="analytics-panel"><h3>Ready for your first visits</h3><p className="text-zinc-400">Charts will populate after visitors allow analytics and browse the site. Historical traffic is unavailable.</p></div>}
            <section className="analytics-panel"><h3>Daily page views <span className="text-xs text-zinc-500">UTC · first and last days may be partial</span></h3><div className="analytics-trend" role="img" aria-label="Daily page views chart">{dates.map(date => { const n = data.daily.find(r => r._id === date)?.count || 0; return <div key={date} title={`${date}: ${n} views`}><span style={{ height: `${Math.max(2, n / maxDay * 100)}%`, opacity: n ? 1 : .15 }} /></div>; })}</div><div className="flex justify-between text-xs text-zinc-500 mt-3"><span>{dates[0]}</span><span>{dates[dates.length - 1]}</span></div><details className="mt-4 text-sm"><summary>View daily numbers</summary>{dates.map(date => <p key={date}>{date}: {data.daily.find(r => r._id === date)?.count || 0}</p>)}</details></section>
            {!data.geoEnabled && <p className="text-sm text-amber-200">Location is unavailable on this host. Country, region and city are filled automatically on Vercel; localhost visits appear as Unknown.</p>}
            <div className="analytics-grid"><Breakdown title="Top pages · views" rows={data.pages} /><Breakdown title="Traffic sources · views" rows={data.referrers} /><Breakdown title="Countries · views" rows={data.countries} /><Breakdown title="Cities / regions · views" rows={data.cities} /><Breakdown title="Screen sizes · views" rows={data.devices} /><Breakdown title="Browsers · views" rows={data.browsers} /><Breakdown title="Operating systems · views" rows={data.systems} /></div>
            <section className="analytics-panel"><div className="flex flex-wrap gap-3 justify-between mb-5"><h3>Click heatmap</h3><div className="flex flex-wrap gap-2"><select aria-label="Heatmap page" value={path} onChange={e => setPath(e.target.value)}>{Array.from(new Set([path, '/', ...data.paths.map(p => p._id)])).map(p => <option key={p}>{p}</option>)}</select><select aria-label="Heatmap device" value={device} onChange={e => setDevice(e.target.value)}>{['Mobile', 'Tablet', 'Desktop'].map(d => <option key={d}>{d}</option>)}</select></div></div>
                <p className="text-sm text-zinc-400 mb-5">Normalized viewport click density, across scroll positions. This is a coordinate map, not a page screenshot or session recording. Embedded video player clicks are not available.</p>
                <div className="heatmap" style={{ aspectRatio: device === 'Mobile' ? '9 / 16' : device === 'Tablet' ? '3 / 4' : '16 / 9', maxWidth: device === 'Mobile' ? 360 : 800 }} role="img" aria-label={`${path} ${device} click heatmap, ${data.heat.reduce((sum, p) => sum + p.count, 0)} clicks`}>
                    {data.heat.map(p => <span key={`${p._id.x}-${p._id.y}`} title={`${p.count} clicks`} style={{ left: `${(p._id.x + .5) * 5}%`, top: `${(p._id.y + .5) * 5}%`, opacity: .3 + .7 * p.count / maxHeat, background: p.count / maxHeat > .6 ? '#ff5733' : '#ffc74f' }} />)}
                    {!data.heat.length && <p>No clicks recorded for this page and screen size.</p>}
                </div><div className="flex flex-wrap justify-between gap-3 text-sm text-zinc-400 mt-4"><span>Top of viewport ↑ · warmer colors = more clicks</span><span>Average maximum scroll: {data.depth[0] ? `${Math.round(data.depth[0].average)}% across ${data.depth[0].views} page visits` : 'No data'}</span></div>
            </section><p className="text-xs text-zinc-500">Events expire after 90 days. No raw IP addresses, names, form values, query strings or screen recordings are stored. Approximate IP locations may reflect a VPN. Referrers can be unavailable. Admin pages are excluded.</p>
        </>}
    </div>;
}
