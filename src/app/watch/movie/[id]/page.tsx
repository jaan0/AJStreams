'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import { ArrowLeft, Loader } from 'react-feather';
import { createBingrMovieUrl } from '@/lib/embed';

export default function MovieWatchPage() {
    const params = useParams();
    const router = useRouter();
    const tmdbId = params.id as string;

    const [movieTitle, setMovieTitle] = useState('Movie');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tmdbId) return;

        const fetchDetails = async () => {
            try {
                const res = await fetch(`/api/tmdb/movie/${tmdbId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMovieTitle(data.title || 'Movie');
                }
            } catch (err) {
                console.error('Failed to fetch movie metadata:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [tmdbId]);

    const handleClose = () => {
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <Loader className="animate-spin text-slate-500 mb-4" size={40} />
                <p className="text-sm font-medium text-zinc-400">Loading movie stream...</p>
            </div>
        );
    }

    return (
        <div className="bg-black flex overflow-hidden" style={{ height: '100dvh' }}>
            <div className="relative flex-1 flex flex-col">
                <div className="flex-1 relative">
                    <VideoPlayer
                        videoUrl={createBingrMovieUrl(tmdbId)}
                        title={movieTitle}
                        mediaType="movie"
                        tmdbId={tmdbId}
                        onClose={handleClose}
                    />
                </div>
            </div>
        </div>
    );
}
