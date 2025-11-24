'use client';

import { useState, useEffect } from 'react';
import { IMovie } from '@/models/Movie';
import MovieSection from './MovieSection';
import { Star } from 'react-feather';

interface AIRecommendationsProps {
    onPlay: (movie: IMovie) => void;
}

export default function AIRecommendations({ onPlay }: AIRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<IMovie[]>([]);
    const [isPersonalized, setIsPersonalized] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/recommendations');
            if (res.ok) {
                const data = await res.json();
                setRecommendations(data.recommendations || []);
                setIsPersonalized(data.personalized || false);
                setMessage(data.message || '');
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="py-12 px-4 md:px-12">
                <div className="flex items-center gap-3 mb-6">
                    <Star className="text-brand-purple animate-pulse" size={24} />
                    <h2 className="text-2xl font-bold text-white">Loading AI Recommendations...</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-white/5 rounded-card animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return null;
    }

    return (
        <div className="relative py-6">
            {/* AI Badge */}
            <div className="px-4 md:px-12 mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-brand text-white text-sm font-bold shadow-glow">
                    <Star size={16} />
                    <span>{isPersonalized ? 'Personalized for You' : 'AI Curated'}</span>
                </div>
                {message && (
                    <p className="text-zinc-400 text-sm mt-2">{message}</p>
                )}
            </div>

            {/* Movie Section */}
            <MovieSection
                title="AI Recommended"
                movies={recommendations}
                onPlay={onPlay}
            />

            {/* Refresh Button */}
            <div className="px-4 md:px-12 mt-4">
                <button
                    onClick={fetchRecommendations}
                    className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    <Star size={14} />
                    Refresh Recommendations
                </button>
            </div>
        </div>
    );
}
