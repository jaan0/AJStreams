'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bookmark } from 'react-feather';
import MovieCard from '@/components/MovieCard';
import MovieDetailsModal from '@/components/MovieDetailsModal';
import Footer from '@/components/Footer';
import type { IMovie } from '@/models/Movie';

export default function MyListPage() {
    const { status } = useSession();
    const [favorites, setFavorites] = useState<IMovie[]>([]);
    const [selected, setSelected] = useState<IMovie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const load = async () => {
        setLoading(true); setError(false);
        try { const res = await fetch('/api/user/favorites'); if (!res.ok) throw new Error(); const data = await res.json(); if (!Array.isArray(data)) throw new Error(); setFavorites(data); } catch { setError(true); } finally { setLoading(false); }
    };
    useEffect(() => { if (status === 'authenticated') load(); else if (status === 'unauthenticated') setLoading(false); }, [status]);
    return <>
        <div className="library-page">
            <header className="library-heading"><div><span className="eyebrow">SAVED FOR A GOOD NIGHT</span><h1>My List</h1><p>All the stories you have been meaning to watch.</p></div><span className="text-xs text-zinc-500">{favorites.length} saved titles</span></header>
            {status === 'loading' || loading ? <div role="status" className="library-grid">{Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded-lg" />)} </div> : status === 'unauthenticated' ? <div className="empty-state"><Bookmark size={34} className="mx-auto" /><h2>A space for your favorites.</h2><p>Sign in to keep your next watch close.</p><Link href="/account" className="btn-primary inline-block mt-6">Sign in</Link></div> : error ? <div className="empty-state"><h2>Your list could not load.</h2><button className="btn-secondary mt-5" onClick={load}>Try again</button></div> : favorites.length ? <div className="library-grid">{favorites.map(movie => <MovieCard key={String(movie._id)} movie={movie} onPlay={setSelected} />)}</div> : <div className="empty-state"><Bookmark size={34} className="mx-auto" /><h2>Your next favorite is out there.</h2><p>Open a title and add it to your list to find it here.</p><Link href="/movies" className="btn-primary inline-block mt-6">Explore the collection</Link></div>}
        </div>
        <Footer />
        {selected && <MovieDetailsModal movie={selected} onClose={() => { setSelected(null); load(); }} />}
    </>;
}
