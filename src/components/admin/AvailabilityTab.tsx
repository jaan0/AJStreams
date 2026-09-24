'use client';
import { useEffect, useState } from 'react';
import type { IMovie } from '@/models/Movie';
import { visibleAvailability } from '@/lib/availability';
import AvailabilityBadge from '@/components/AvailabilityBadge';
type Episode = { _id: { movie: string; scope: string; provider: string }; reports: number };
export default function AvailabilityTab() {
    const [query, setQuery] = useState(''), [page, setPage] = useState(0), [refresh, setRefresh] = useState(0);
    const [movies, setMovies] = useState<IMovie[]>([]), [total, setTotal] = useState(0), [episodes, setEpisodes] = useState<Episode[]>([]);
    const [error, setError] = useState(''), [loading, setLoading] = useState(false), [busy, setBusy] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            setLoading(true); setError('');
            fetch(`/api/admin/availability?${new URLSearchParams({ query, page: String(page) })}`, { signal: controller.signal, cache: 'no-store' }).then(async res => { if (!res.ok) throw new Error('Availability could not load.'); return res.json(); }).then(data => { setMovies(data.movies); setTotal(data.total); setEpisodes(data.episodes); }).catch(err => { if (err.name !== 'AbortError') setError(err.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        }, 250);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [query, page, refresh]);
    const update = async (id: string, action: string) => {
        setBusy(id); setError('');
        try { const res = await fetch('/api/admin/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) }); if (!res.ok) throw new Error('Status could not be saved.'); setRefresh(v => v + 1); } catch (err) { setError((err as Error).message); } finally { setBusy(''); }
    };
    return <section className="space-y-5"><h2 className="text-2xl font-semibold">Playback availability</h2><p className="text-sm text-zinc-400">Automatic reports come from signed-in playback: direct-file decode/source errors and VidLink’s failure callback. Three independent viewers or one admin confirm a source failure. Unknown Bingr/MultiEmbed status never counts as failure. One working source keeps the title available; one failed source shows “Playback issues”. All configured sources must fail for an automatic “Unavailable” badge. Status expires after 24 hours and successful playback clears it.</p><p className="text-sm text-zinc-400">Bingr failures may need manual review. Mark unavailable only after checking alternative servers. A failed TV episode is listed separately and never disables the whole show.</p>
        <div className="flex flex-wrap gap-3"><input className="bg-white/5 border border-white/20 rounded-lg p-3 min-w-0 flex-1" aria-label="Search availability titles" placeholder="Search titles…" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} /><button className="btn-secondary" onClick={() => setRefresh(v => v + 1)}>Refresh</button></div>
        {loading && <p role="status">Loading…</p>}{error && <p role="alert" className="text-red-300">{error}</p>}
        {movies.map(movie => <article key={String(movie._id)} className="rounded-xl border border-white/10 p-4 space-y-3"><div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold">{movie.title}</h3><AvailabilityBadge movie={movie} />{['unknown', 'available'].includes(visibleAvailability(movie)) && <span className="text-xs text-zinc-400">{visibleAvailability(movie) === 'available' ? 'Playback confirmed' : 'Not confirmed'}</span>}</div><p className="text-xs text-zinc-500">{movie.availability?.checkedAt ? `Last update: ${new Date(movie.availability.checkedAt).toLocaleString()} · ${movie.availability.reason}` : 'No playback reports yet'}</p>{episodes.filter(e => e._id.movie === String(movie._id)).map(e => <p key={`${e._id.scope}-${e._id.provider}`} className="text-sm text-amber-200">Episode {e._id.scope.replace(':', ' / ')} · {e._id.provider}: {e.reports} failure report(s)</p>)}<div className="flex flex-wrap gap-2"><button disabled={!!busy} className="btn-secondary text-xs" onClick={() => update(String(movie._id), 'unavailable')}>Mark unavailable</button><button disabled={!!busy} className="btn-secondary text-xs" onClick={() => update(String(movie._id), 'reset')}>Reset status</button></div></article>)}
        {!loading && !movies.length && <p>No matching titles.</p>}<div className="flex gap-3 items-center"><button className="btn-secondary" disabled={page === 0 || loading} onClick={() => setPage(v => v - 1)}>Previous</button><span className="text-sm">Page {page + 1} · {total} titles</span><button className="btn-secondary" disabled={(page + 1) * 30 >= total || loading} onClick={() => setPage(v => v + 1)}>Next</button></div>
    </section>;
}
