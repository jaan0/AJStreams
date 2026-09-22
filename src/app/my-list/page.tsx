'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import MovieSection from '@/components/MovieSection';
import VideoPlayer from '@/components/VideoPlayer';
import { IMovie } from '@/models/Movie';

export default function MyListPage() {
    const { data: session, status } = useSession();
    const [favorites, setFavorites] = useState<IMovie[]>([]);
    const [playingMovie, setPlayingMovie] = useState<IMovie | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            redirect('/');
        }
        if (status === 'authenticated') {
            fetchFavorites();
        }
    }, [status]);

    const fetchFavorites = async () => {
        try {
            const res = await fetch('/api/user/favorites');
            const data = await res.json();
            setFavorites(data);
        } catch (error) {
            console.error('Failed to fetch favorites', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (status === 'loading' || isLoading) {
        return <div className="p-12 text-center text-white">Loading...</div>;
    }

    return (
        <div className="min-h-screen pb-20">
            <div className="pt-24 px-4 md:px-12">
                <h1 className="text-3xl font-bold text-white mb-8">My List</h1>
                {favorites.length > 0 ? (
                    <MovieSection
                        title=""
                        movies={favorites}
                        onPlay={setPlayingMovie}
                    />
                ) : (
                    <div className="text-zinc-400">
                        You haven't added any movies to your list yet.
                    </div>
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
