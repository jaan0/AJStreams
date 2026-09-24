'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import MovieCard from '@/components/MovieCard';
import MovieDetailsModal from '@/components/MovieDetailsModal';
import Footer from '@/components/Footer';
import type { IMovie } from '@/models/Movie';
import { Film } from 'react-feather';

export default function MoviesPage() {
    return <Suspense fallback={<div className="library-page" role="status">Loading collection…</div>}><MovieCollection /></Suspense>;
}

function MovieCollection() {
    const searchParams = useSearchParams();
    const selectedGenre = searchParams.get('genre') || 'All genres';
    const [movies, setMovies] = useState<IMovie[]>([]);
    const [selected, setSelected] = useState<IMovie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [query, setQuery] = useState('');
    const [genre, setGenre] = useState('All genres');
    const [sort, setSort] = useState('recent');
    const load = async () => {
        setLoading(true); setError(false);
        try { const res = await fetch('/api/movies'); if (!res.ok) throw new Error(); const data = await res.json(); if (!Array.isArray(data)) throw new Error(); setMovies(data); } catch { setError(true); } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);
    useEffect(() => { setGenre(selectedGenre); }, [selectedGenre]);
    const genres = useMemo(() => Array.from(new Set(movies.flatMap(movie => movie.genre))).sort(), [movies]);
    const results = useMemo(() => {
        const filtered = movies.filter(movie => movie.title.toLowerCase().includes(query.toLowerCase()) && (genre === 'All genres' || movie.genre.includes(genre)));
        if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
        if (sort === 'year') filtered.sort((a, b) => b.year - a.year);
        if (sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
        return filtered;
    }, [movies, query, genre, sort]);
    return <>
        <div className="library-page">
            <header className="library-heading"><div><span className="eyebrow">THE COLLECTION</span><h1>Find your next obsession.</h1><p>Movies, series, and stories you will want to come back to.</p></div><span className="text-xs text-zinc-500">{movies.length} titles</span></header>
            <div className="library-tools"><input aria-label="Search titles" placeholder="Search the collection…" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Filter by genre" value={genre} onChange={e => setGenre(e.target.value)}><option>All genres</option>{genres.map(item => <option key={item}>{item}</option>)}</select><select aria-label="Sort titles" value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Recently added</option><option value="rating">Top rated</option><option value="year">Release year</option><option value="title">A–Z</option></select></div>
            {loading ? <div className="library-grid" role="status" aria-label="Loading movies">{Array.from({ length: 12 }, (_, i) => <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />)}</div> : error ? <div className="empty-state"><h2>The collection could not load.</h2><p>Please try again in a moment.</p><button onClick={load} className="btn-secondary mt-5">Try again</button></div> : results.length ? <div className="library-grid">{results.map(movie => <MovieCard key={String(movie._id)} movie={movie} onPlay={setSelected} />)}</div> : <div className="empty-state"><Film className="mx-auto" size={36} /><h2>No titles found.</h2><p>Try another search or choose a different genre.</p></div>}
        </div>
        <Footer />
        {selected && <MovieDetailsModal movie={selected} onClose={() => setSelected(null)} />}
    </>;
}
