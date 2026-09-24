'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'react-feather';

export type GenreCard = { name: string; image: string; count: number };
export function getGenreCards(movies: { genre: string[]; posterUrl: string }[]): GenreCard[] {
    const genres = new Map<string, GenreCard>();
    movies.forEach(movie => movie.genre.forEach(name => {
        const card = genres.get(name);
        if (card) card.count++;
        else genres.set(name, { name, image: movie.posterUrl, count: 1 });
    }));
    return [...genres.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
const colors = ['#ad525d', '#177b7d', '#79713d', '#08748e', '#61416f', '#34516c'];
export default function GenreCards({ genres, all = false }: { genres: GenreCard[]; all?: boolean }) {
    const row = useRef<HTMLDivElement>(null);
    return <section className="genre-section" aria-label="Popular Genres">
        {!all && <div className="genre-heading"><h2>Popular Genres</h2><Link href="/categories/all/GENRES">View All <ChevronRight size={16} /></Link></div>}
        <div className={all ? 'genre-grid' : 'genre-row'} ref={row}>
            {genres.map((genre, i) => <Link href={`/movies?genre=${encodeURIComponent(genre.name)}`} key={genre.name} className="genre-card" style={{ backgroundColor: colors[i % colors.length] }}>
                {genre.image && <img src={genre.image} alt="" loading="lazy" />}
                <span className="genre-shade" /><div><h3>{genre.name}</h3><span>{genre.count} titles</span></div>
            </Link>)}
        </div>
        {!all && <div className="genre-arrows"><button aria-label="Previous genres" onClick={() => row.current?.scrollBy({ left: -560, behavior: 'smooth' })}><ChevronLeft size={18} /></button><button aria-label="Next genres" onClick={() => row.current?.scrollBy({ left: 560, behavior: 'smooth' })}><ChevronRight size={18} /></button></div>}
        {!genres.length && <p className="text-zinc-400">Genres will appear when titles are added to the library.</p>}
    </section>;
}
