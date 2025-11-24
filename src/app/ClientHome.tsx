'use client';

import { useState } from 'react';
import Hero from '@/components/Hero';
import MovieSection from '@/components/MovieSection';
import AIRecommendations from '@/components/AIRecommendations';
import MovieDetailsModal from '@/components/MovieDetailsModal';
import VideoPlayer from '@/components/VideoPlayer';
import Footer from '@/components/Footer';
import { IMovie } from '@/models/Movie';

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
    const [playingMovie, setPlayingMovie] = useState<IMovie | null>(null);
    const [selectedMovie, setSelectedMovie] = useState<IMovie | null>(null);

    const handlePlay = (movie: IMovie) => {
        setPlayingMovie(movie);
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
            <div className="relative z-10 space-y-8 -mt-20">
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

            {/* Video Player Modal */}
            {playingMovie && (
                <VideoPlayer
                    videoUrl={playingMovie.videoUrl}
                    title={playingMovie.title}
                    onClose={() => setPlayingMovie(null)}
                />
            )}

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
