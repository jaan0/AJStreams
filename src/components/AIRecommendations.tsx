'use client';

import { useState, useEffect } from 'react';
import MovieSection from './MovieSection';
import type { IMovie } from '@/models/Movie';

export default function AIRecommendations({ onPlay }: { onPlay: (movie: IMovie) => void }) {
    const [movies, setMovies] = useState<IMovie[]>([]);
    const [personalized, setPersonalized] = useState(false);
    useEffect(() => {
        const controller = new AbortController();
        fetch('/api/recommendations', { signal: controller.signal }).then(res => res.ok ? res.json() : null).then(data => { if (Array.isArray(data?.recommendations)) { setMovies(data.recommendations); setPersonalized(Boolean(data.personalized)); } }).catch(() => {});
        return () => controller.abort();
    }, []);
    return <MovieSection title={personalized ? 'Picked for you' : 'Something worth watching'} movies={movies} onPlay={onPlay} />;
}
