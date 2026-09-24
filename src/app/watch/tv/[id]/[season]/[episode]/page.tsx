'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer';
import EpisodeSidebar, { SeasonInfo } from '@/components/EpisodeSidebar';
import TvNavigationControls from '@/components/TvNavigationControls';
import { ArrowLeft, Loader, Film, Layers } from 'react-feather';
import { buildBingrTvUrl } from '@/lib/embed';

export default function TvWatchPage() {
    const params = useParams();
    const router = useRouter();

    const tmdbId = params.id as string;
    const initialSeason = parseInt(params.season as string, 10) || 1;
    const initialEpisode = parseInt(params.episode as string, 10) || 1;

    const [season, setSeason] = useState(initialSeason);
    const [episode, setEpisode] = useState(initialEpisode);
    const [seriesTitle, setSeriesTitle] = useState('TV Series');
    const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Synchronize state if URL route parameters change
    useEffect(() => {
        if (params.season) setSeason(parseInt(params.season as string, 10) || 1);
        if (params.episode) setEpisode(parseInt(params.episode as string, 10) || 1);
    }, [params.season, params.episode]);

    // Fetch TV metadata from TMDB
    useEffect(() => {
        if (!tmdbId) return;

        const fetchDetails = async () => {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/tmdb/tv/${tmdbId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSeriesTitle(data.title || 'TV Series');
                    if (data.seasons && data.seasons.length > 0) {
                        setSeasons(data.seasons);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch series info:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [tmdbId]);

    // Handle switching episode
    const handleSelectEpisode = (newSeason: number, newEpisode: number) => {
        setSeason(newSeason);
        setEpisode(newEpisode);
        // Update URL path without full refresh
        window.history.pushState(
            null,
            '',
            `/watch/tv/${tmdbId}/${newSeason}/${newEpisode}`
        );
    };

    const handlePrevEpisode = () => {
        if (episode > 1) {
            handleSelectEpisode(season, episode - 1);
        }
    };

    const handleNextEpisode = () => {
        handleSelectEpisode(season, episode + 1);
    };

    const handleClose = () => {
        router.push('/');
    };

    const currentEmbedUrl = buildBingrTvUrl(tmdbId, season, episode);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex overflow-hidden">
                <div className="relative flex-1 flex flex-col p-4 md:p-8">
                    <div className="w-full h-12 mb-4 animate-pulse bg-zinc-900 rounded-lg max-w-sm" />
                    <div className="flex-1 w-full animate-pulse bg-zinc-900 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        /* 100dvh: dynamic viewport height - handles mobile browser bar correctly */
        <div className="bg-black flex overflow-hidden" style={{ height: '100dvh' }}>
            {/* Main Player Area */}
            <div className="relative flex-1 flex flex-col">
                {/* Video Player — fills all available height */}
                <div className="flex-1 relative h-full">
                    <VideoPlayer
                        videoUrl={currentEmbedUrl}
                        title={`${seriesTitle} - S${season}:E${episode}`}
                        mediaType="tv"
                        tmdbId={tmdbId}
                        season={season}
                        episode={episode}
                        onClose={handleClose}
                        tvControls={
                            <TvNavigationControls
                                currentSeason={season}
                                currentEpisode={episode}
                                onPrevEpisode={handlePrevEpisode}
                                onNextEpisode={handleNextEpisode}
                                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                                isSidebarOpen={isSidebarOpen}
                                hasPrev={episode > 1}
                                hasNext={true}
                            />
                        }
                    />
                </div>

                {/* Desktop: Right-side floating Episodes tab (md+) */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 items-center gap-2 bg-gradient-to-l from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white pl-3.5 pr-2.5 py-3 rounded-l-2xl shadow-[0_0_30px_rgba(168,85,247,0.5)] border-y border-l border-white/20 transition-all hover:pl-4 group"
                    title="Open Episodes list"
                >
                    <Layers size={16} className="text-slate-200 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold tracking-wider uppercase">Episodes</span>
                </button>

                {/* Mobile: Bottom Episodes bar */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2.5 bg-black/90 backdrop-blur-xl border-t border-white/10"
                    style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
                >
                    {/* Prev episode */}
                    <button
                        onClick={handlePrevEpisode}
                        disabled={episode <= 1}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 disabled:opacity-40 active:bg-white/10"
                    >
                        <span>⏮</span>
                        <span>Prev</span>
                    </button>

                    {/* Center: Current episode + Episodes button */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-600/30 hover:bg-slate-600/50 border border-slate-500/40 rounded-xl text-white text-xs font-bold transition-all active:scale-95"
                    >
                        <Layers size={13} />
                        <span>S{season}:E{episode}</span>
                        <span className="text-slate-300">Episodes</span>
                    </button>

                    {/* Next episode */}
                    <button
                        onClick={handleNextEpisode}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 active:bg-white/10"
                    >
                        <span>Next</span>
                        <span>⏭</span>
                    </button>
                </div>
            </div>

            {/* Episodes Sidebar (bottom sheet on mobile, right drawer on desktop) */}
            <EpisodeSidebar
                tmdbId={tmdbId}
                currentSeason={season}
                currentEpisode={episode}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onSelectEpisode={handleSelectEpisode}
                seriesTitle={seriesTitle}
                availableSeasons={seasons}
            />
        </div>
    );
}
