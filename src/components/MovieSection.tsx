'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'react-feather';
import type { IMovie } from '@/models/Movie';
import MovieCard from './MovieCard';

export default function MovieSection({ title, movies, onPlay }: { title: string; movies: IMovie[]; onPlay: (movie: IMovie) => void }) {
    const row = useRef<HTMLDivElement>(null);
    if (!movies.length) return null;
    const scroll = (direction: number) => row.current?.scrollBy({ left: direction * row.current.clientWidth * 0.8, behavior: 'smooth' });
    return <section className="catalog-section" aria-label={title || 'Movies'}>
        <div className="section-heading"><h2>{title}</h2><div className="flex gap-2"><button className="row-arrow" aria-label={`Scroll ${title || 'movies'} left`} onClick={() => scroll(-1)}><ChevronLeft size={16} /></button><button className="row-arrow" aria-label={`Scroll ${title || 'movies'} right`} onClick={() => scroll(1)}><ChevronRight size={16} /></button></div></div>
        <div ref={row} className="poster-row scrollbar-hide">{movies.map(movie => <MovieCard key={String(movie._id)} movie={movie} onPlay={onPlay} />)}</div>
    </section>;
}
