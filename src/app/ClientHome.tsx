'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Hero from '@/components/Hero';
import MovieSection from '@/components/MovieSection';
import AIRecommendations from '@/components/AIRecommendations';
import MovieDetailsModal from '@/components/MovieDetailsModal';
import Footer from '@/components/Footer';
import { IMovie } from '@/models/Movie';
import { extractBingrTvParams } from '@/lib/embed';

interface ClientHomeProps {
    featuredMovies: IMovie[];
    moviesByGenre: { genre: string; movies: IMovie[] }[];
    allMovies: IMovie[];
}

export default function ClientHome({
    featuredMovies,
    moviesByGenre,
    allMovies,
}: ClientHomeProps) {
    const router = useRouter();
    const [selectedMovie, setSelectedMovie] = useState<IMovie | null>(null);

    const handlePlay = (movie: IMovie) => {
        const tvParams = extractBingrTvParams(movie.videoUrl);
        if (tvParams.isBingrTv && tvParams.tmdbId) {
            router.push(`/watch/tv/${tvParams.tmdbId}/${tvParams.season || 1}/${tvParams.episode || 1}`);
            return;
        }
        router.push(`/movie/${movie._id}`);
    };

    const handleMoreInfo = (movie: IMovie) => {
        setSelectedMovie(movie);
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <Hero
                movies={featuredMovies}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
            />

            {/* Content Sections */}
            <div className="relative z-10 space-y-8 mt-0 md:-mt-20">
                {/* AI Recommendations - Featured First */}
                <AIRecommendations onPlay={handlePlay} />

                {/* Genre Sections */}
                {moviesByGenre.map((section) => (
                    <MovieSection
                        key={section.genre}
                        title={section.genre}
                        movies={section.movies}
                        onPlay={handlePlay}
                    />
                ))}

                {/* Fallback if no genres */}
                {moviesByGenre.length === 0 && allMovies.length > 0 && (
                    <MovieSection
                        title="All Movies"
                        movies={allMovies}
                        onPlay={handlePlay}
                    />
                )}
            </div>

            {/* Footer */}
            <Footer />

            {/* Movie Details Modal */}
            {selectedMovie && (
                <MovieDetailsModal
                    movie={selectedMovie}
                    onClose={() => setSelectedMovie(null)}
                />
            )}
        </div>
    );
}
