'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Hero from '@/components/Hero';
import MovieSection from '@/components/MovieSection';
import AIRecommendations from '@/components/AIRecommendations';
import MovieDetailsModal from '@/components/MovieDetailsModal';
import Footer from '@/components/Footer';
import GenreCards, { getGenreCards } from '@/components/GenreCards';
import type { IMovie } from '@/models/Movie';
import { extractBingrTvParams } from '@/lib/embed';

interface ClientHomeProps { featuredMovies: IMovie[]; moviesByGenre: { genre: string; movies: IMovie[] }[]; allMovies: IMovie[]; }

export default function ClientHome({ featuredMovies, moviesByGenre, allMovies }: ClientHomeProps) {
    const router = useRouter();
    const [selectedMovie, setSelectedMovie] = useState<IMovie | null>(null);
    const [category, setCategory] = useState('All');
    const handlePlay = (movie: IMovie) => {
        const tv = extractBingrTvParams(movie.videoUrl);
        router.push(tv.isBingrTv && tv.tmdbId ? `/watch/tv/${tv.tmdbId}/${tv.season || 1}/${tv.episode || 1}` : `/movie/${movie._id}`);
    };
    const heroMovies = [...featuredMovies, ...allMovies.filter(movie => !featuredMovies.some(featured => String(featured._id) === String(movie._id)))].slice(0, 6);
    const categories = ['All', ...Array.from(new Set(allMovies.flatMap(movie => movie.genre))).slice(0, 8)];
    return <div className="min-h-screen">
        <Hero movies={heroMovies} onPlay={handlePlay} onMoreInfo={setSelectedMovie} />
        <div className="home-content">
            <div className="catalog-tabs scrollbar-hide" role="group" aria-label="Filter by genre">{categories.map(genre => <button key={genre} className={category === genre ? 'active' : ''} onClick={() => setCategory(genre)} aria-pressed={category === genre}>{genre}</button>)}</div>
            {category === 'All' ? <>
                <MovieSection title="Recently added" movies={allMovies.slice(0, 18)} onPlay={setSelectedMovie} />
                <GenreCards genres={getGenreCards(allMovies)} />
                <AIRecommendations onPlay={setSelectedMovie} />
                {moviesByGenre.map(section => <MovieSection key={section.genre} title={section.genre} movies={section.movies} onPlay={setSelectedMovie} />)}
            </> : <MovieSection title={`${category} picks`} movies={allMovies.filter(movie => movie.genre.includes(category))} onPlay={setSelectedMovie} />}
        </div>
        <Footer />
        {selectedMovie && <MovieDetailsModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} />}
    </div>;
}
