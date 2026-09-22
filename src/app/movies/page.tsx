'use client';

import { useState, useEffect } from 'react';
import MovieSection from '@/components/MovieSection';
import VideoPlayer from '@/components/VideoPlayer';
import { IMovie } from '@/models/Movie';
import MovieCardSkeleton from '@/components/skeletons/MovieCardSkeleton';

export default function MoviesPage() {
    const [movies, setMovies] = useState<IMovie[]>([]);
    const [playingMovie, setPlayingMovie] = useState<IMovie | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        try {
            const res = await fetch('/api/movies');
            const data = await res.json();
            setMovies(data);
        } catch (error) {
            console.error('Failed to fetch movies', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen pb-20">
            <div className="pt-24 px-4 md:px-12">
                <h1 className="text-3xl font-bold text-white mb-8">All Movies</h1>
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <MovieSection
                        title=""
                        movies={movies}
                        onPlay={setPlayingMovie}
                    />
                )}
            </div>

            {playingMovie && (
                <VideoPlayer
                    videoUrl={playingMovie.videoUrl}
                    title={playingMovie.title}
                    onClose={() => setPlayingMovie(null)}
                />
            )}
        </div>
    );
}
