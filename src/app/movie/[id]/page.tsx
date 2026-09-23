'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import VideoPlayer from '@/components/VideoPlayer';
import EpisodeSidebar from '@/components/EpisodeSidebar';
import TvNavigationControls from '@/components/TvNavigationControls';
import { ArrowLeft, Layers } from 'react-feather';
import Pusher, { Channel } from 'pusher-js';
import WatchPartyChat from '@/components/WatchPartyChat';
import ErrorBoundary from '@/components/ErrorBoundary';
import VideoErrorFallback from '@/components/VideoErrorFallback';
import ChatErrorFallback from '@/components/ChatErrorFallback';
import { extractBingrTvParams, buildBingrTvUrl, extractTmdbId } from '@/lib/embed';

interface Movie {
    _id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
    posterUrl?: string;
    genre: string[];
    year: number;
}

export default function MoviePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();

    const movieId = params.id as string;
    const partyId = searchParams.get('party');

    // TV season & episode from query params if present (e.g. ?s=1&e=14)
    const paramSeason = searchParams.get('s') || searchParams.get('season');
    const paramEpisode = searchParams.get('e') || searchParams.get('episode');

    const [movie, setMovie] = useState<Movie | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [channel, setChannel] = useState<Channel | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [shareCode, setShareCode] = useState<string | null>(null);

    // TV Series Episode State
    const [isTvShow, setIsTvShow] = useState(false);
    const [tvTmdbId, setTvTmdbId] = useState<string>('');
    const [currentSeason, setCurrentSeason] = useState<number>(1);
    const [currentEpisode, setCurrentEpisode] = useState<number>(1);
    const [isEpisodeSidebarOpen, setIsEpisodeSidebarOpen] = useState(false);

    useEffect(() => {
        if (movieId) {
            fetchMovie();
        }
    }, [movieId]);

    // Detect if movie is a TV series from its videoUrl or params
    useEffect(() => {
        if (movie?.videoUrl) {
            const tvParams = extractBingrTvParams(movie.videoUrl);
            if (tvParams.isBingrTv && tvParams.tmdbId) {
                setIsTvShow(true);
                setTvTmdbId(tvParams.tmdbId);
                const s = paramSeason ? parseInt(paramSeason, 10) : (tvParams.season || 1);
                const e = paramEpisode ? parseInt(paramEpisode, 10) : (tvParams.episode || 1);
                setCurrentSeason(s);
                setCurrentEpisode(e);
            }
        }
    }, [movie, paramSeason, paramEpisode]);

    useEffect(() => {
        if (partyId && session?.user) {
            const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
            const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

            if (!pusherKey) {
                console.error('Pusher key is missing. Please check NEXT_PUBLIC_PUSHER_KEY in .env.local');
                return;
            }

            const pusher = new Pusher(pusherKey, {
                cluster: pusherCluster || 'mt1',
                authEndpoint: '/api/pusher/auth',
            });

            const channelName = `private-watch-party-${partyId}`;
            const subscribedChannel = pusher.subscribe(channelName);
            setChannel(subscribedChannel);

            checkHostStatus();

            return () => {
                pusher.unsubscribe(channelName);
                pusher.disconnect();
            };
        }
    }, [partyId, session]);

    const checkHostStatus = async () => {
        if (!partyId || !session?.user?.email) return;
        try {
            const res = await fetch(`/api/watch-party?id=${partyId}`);
            if (res.ok) {
                const currentParty = await res.json();
                if (currentParty) {
                    if (currentParty.host.email === session.user.email) {
                        setIsHost(true);
                    }
                    setShareCode(currentParty.shareCode);
                }
            }
        } catch (error) {
            console.error('Failed to check host status:', error);
        }
    };

    const fetchMovie = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/movies/${movieId}`);

            if (res.ok) {
                const data = await res.json();
                setMovie(data);
            } else {
                console.error('Movie not found');
                router.push('/');
            }
        } catch (error) {
            console.error('Failed to fetch movie:', error);
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectEpisode = (season: number, episode: number) => {
        setCurrentSeason(season);
        setCurrentEpisode(episode);
        // Update URL query params without reloading
        const url = new URL(window.location.href);
        url.searchParams.set('s', season.toString());
        url.searchParams.set('e', episode.toString());
        window.history.replaceState(null, '', url.toString());
    };

    const handlePrevEpisode = () => {
        if (currentEpisode > 1) {
            handleSelectEpisode(currentSeason, currentEpisode - 1);
        }
    };

    const handleNextEpisode = () => {
        handleSelectEpisode(currentSeason, currentEpisode + 1);
    };

    const handleClose = () => {
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    if (!movie) {
        return null;
    }

    // Active video URL: if TV show, calculate from current season & episode
    const activeVideoUrl = isTvShow && tvTmdbId
        ? buildBingrTvUrl(tvTmdbId, currentSeason, currentEpisode)
        : movie.videoUrl;

    const displayTitle = isTvShow
        ? `${movie.title} · S${currentSeason}:E${currentEpisode}`
        : movie.title;

    return (
        <div className="min-h-screen bg-black flex overflow-hidden">
            {/* Main Content Area */}
            <div
                className={`relative flex-1 flex flex-col transition-all duration-300 ease-in-out ${
                    partyId && isChatOpen ? 'mr-0 md:mr-80 lg:mr-96' : ''
                }`}
            >
                {/* Video Player */}
                <div className="flex-1 relative">
                    <ErrorBoundary fallback={<VideoErrorFallback />}>
                        <VideoPlayer
                            videoUrl={activeVideoUrl}
                            title={displayTitle}
                            mediaType={isTvShow ? 'tv' : 'movie'}
                            tmdbId={isTvShow ? tvTmdbId : (extractTmdbId(movie.videoUrl) || undefined)}
                            season={isTvShow ? currentSeason : undefined}
                            episode={isTvShow ? currentEpisode : undefined}
                            onClose={handleClose}
                            channel={channel}
                            partyId={partyId || undefined}
                            isHost={isHost}
                            tvControls={
                                isTvShow ? (
                                    <TvNavigationControls
                                        currentSeason={currentSeason}
                                        currentEpisode={currentEpisode}
                                        onPrevEpisode={handlePrevEpisode}
                                        onNextEpisode={handleNextEpisode}
                                        onToggleSidebar={() => setIsEpisodeSidebarOpen(!isEpisodeSidebarOpen)}
                                        isSidebarOpen={isEpisodeSidebarOpen}
                                        hasPrev={currentEpisode > 1}
                                        hasNext={true}
                                    />
                                ) : undefined
                            }
                        />
                    </ErrorBoundary>
                </div>

                {/* Floating Middle-Right Tab to easily open Episodes without interfering with video controls */}
                {isTvShow && (
                    <button
                        onClick={() => setIsEpisodeSidebarOpen(!isEpisodeSidebarOpen)}
                        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 bg-gradient-to-l from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white pl-3.5 pr-2.5 py-3 rounded-l-2xl shadow-[0_0_30px_rgba(168,85,247,0.5)] border-y border-l border-white/20 transition-all hover:pl-4 group"
                        title="Open Episodes list"
                    >
                        <Layers size={16} className="text-purple-200 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold tracking-wider uppercase">Episodes</span>
                    </button>
                )}
            </div>

            {/* Right-Side Episodes Drawer (for TV Shows) */}
            {isTvShow && tvTmdbId && (
                <EpisodeSidebar
                    tmdbId={tvTmdbId}
                    currentSeason={currentSeason}
                    currentEpisode={currentEpisode}
                    isOpen={isEpisodeSidebarOpen}
                    onClose={() => setIsEpisodeSidebarOpen(false)}
                    onSelectEpisode={handleSelectEpisode}
                    seriesTitle={movie.title}
                />
            )}

            {/* Watch Party Chat Sidebar */}
            {partyId && session?.user && channel && (
                <div
                    className={`fixed right-0 top-0 bottom-0 z-[70] transition-all duration-300 ease-in-out ${
                        isChatOpen ? 'w-full md:w-80 lg:w-96 translate-x-0' : 'w-0 translate-x-full'
                    }`}
                >
                    <ErrorBoundary fallback={<ChatErrorFallback />}>
                        <WatchPartyChat
                            channel={channel}
                            partyId={partyId}
                            isHost={isHost}
                            shareCode={shareCode || undefined}
                            onToggleMinimize={() => setIsChatOpen(!isChatOpen)}
                            isMinimized={false}
                        />
                    </ErrorBoundary>
                </div>
            )}

            {/* Minimized Chat Button */}
            {partyId && !isChatOpen && session?.user && channel && (
                <div className="fixed top-4 right-4 z-[80]">
                    <WatchPartyChat
                        channel={channel}
                        partyId={partyId}
                        isHost={isHost}
                        shareCode={shareCode || undefined}
                        onToggleMinimize={() => setIsChatOpen(true)}
                        isMinimized={true}
                    />
                </div>
            )}
        </div>
    );
}
