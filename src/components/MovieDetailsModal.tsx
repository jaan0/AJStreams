'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Plus, ThumbsUp, Users, Film, Clock, Calendar, Star, ChevronRight } from 'react-feather';
import { createPortal } from 'react-dom';
import { IMovie } from '@/models/Movie';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WatchPartyModal from './WatchPartyModal';
import { extractBingrTvParams } from '@/lib/embed';
import AvailabilityBadge from './AvailabilityBadge';

interface MovieDetailsModalProps {
    movie: IMovie | null;
    onClose: () => void;
}

interface EpisodePreview {
    id: number;
    episodeNumber: number;
    name: string;
    overview: string;
    stillUrl: string | null;
    runtime: number | null;
}

interface SeasonPreview {
    id: number;
    name: string;
    seasonNumber: number;
    episodeCount: number;
}

export default function MovieDetailsModal({ movie, onClose }: MovieDetailsModalProps) {
    const router = useRouter();
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showWatchParty, setShowWatchParty] = useState(false);

    // TV Series Episode State
    const [isTv, setIsTv] = useState(false);
    const [tvTmdbId, setTvTmdbId] = useState<string>('');
    const [seasons, setSeasons] = useState<SeasonPreview[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<number>(1);
    const [episodes, setEpisodes] = useState<EpisodePreview[]>([]);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

    useEffect(() => {
        if (movie?.videoUrl) {
            const tvParams = extractBingrTvParams(movie.videoUrl);
            if (tvParams.isBingrTv && tvParams.tmdbId) {
                setIsTv(true);
                setTvTmdbId(tvParams.tmdbId);
                setSelectedSeason(tvParams.season || 1);
            } else {
                setIsTv(false);
                setTvTmdbId('');
            }
        }
    }, [movie]);

    // Fetch TV seasons when modal opens
    useEffect(() => {
        if (!isTv || !tvTmdbId) return;

        const fetchSeasons = async () => {
            try {
                const res = await fetch(`/api/tmdb/tv/${tvTmdbId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.seasons && data.seasons.length > 0) {
                        setSeasons(data.seasons);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch series info in modal:', err);
            }
        };

        fetchSeasons();
    }, [isTv, tvTmdbId]);

    // Fetch episodes for selected season
    useEffect(() => {
        if (!isTv || !tvTmdbId || !selectedSeason) return;

        const fetchEpisodes = async () => {
            setIsLoadingEpisodes(true);
            try {
                const res = await fetch(`/api/tmdb/tv/${tvTmdbId}/season/${selectedSeason}`);
                if (res.ok) {
                    const data = await res.json();
                    setEpisodes(data.episodes || []);
                }
            } catch (err) {
                console.error('Failed to fetch modal episodes:', err);
            } finally {
                setIsLoadingEpisodes(false);
            }
        };

        fetchEpisodes();
    }, [isTv, tvTmdbId, selectedSeason]);

    useEffect(() => {
        if (!movie) return;
        const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !showWatchParty) onClose(); };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [movie, onClose, showWatchParty]);

    if (!movie) return null;

    const handlePlayMovie = (targetSeason?: number, targetEpisode?: number) => {
        onClose();
        if (isTv && tvTmdbId) {
            const s = targetSeason || selectedSeason || 1;
            const e = targetEpisode || 1;
            router.push(`/watch/tv/${tvTmdbId}/${s}/${e}`);
            return;
        }
        router.push(`/movie/${movie._id}`);
    };

    // Add to favorites/my list
    const handleAddToList = async () => {
        setIsLoading(true);
        try {
            const method = isFavorite ? 'DELETE' : 'POST';
            const res = await fetch('/api/user/favorites', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movieId: movie._id }),
            });

            if (res.ok) {
                setIsFavorite(!isFavorite);
            } else {
                const data = await res.json();
                alert(data.error || 'Please login to add to your list');
            }
        } catch (error) {
            console.error('Failed to update favorites', error);
            alert('Failed to update list. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = () => {
        setIsLiked(!isLiked);
    };

    const handleJoinParty = (partyId: string) => {
        window.location.href = `/movie/${movie._id}?party=${partyId}`;
    };

    return createPortal(
        <>
            <AnimatePresence>
                {movie && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100]"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-6"
                        >
                            <div role="dialog" aria-modal="true" aria-label={movie.title} className="bg-[#101014] border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-full max-w-5xl max-h-[92vh] flex flex-col relative">
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    aria-label="Close title details" className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/80 hover:bg-black flex items-center justify-center text-white transition-all border border-white/20 hover:scale-110"
                                >
                                    <X size={20} />
                                </button>

                                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 flex-1">
                                    {/* Top Hero / Banner */}
                                    <div className="flex flex-col md:flex-row relative">
                                        {/* Left: Poster */}
                                        <div className="md:w-2/5 flex-shrink-0 relative">
                                            <div className="aspect-[2/3] md:aspect-auto md:h-full relative">
                                                <img
                                                    src={movie.posterUrl}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#101014]" />
                                            </div>
                                        </div>

                                        {/* Right: Details Header */}
                                        <div className="flex-1 p-6 md:p-8 space-y-5 relative">
                                            {/* Title */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 text-[10px] font-bold tracking-wider uppercase">
                                                        {isTv ? 'TV Series' : 'Movie'}
                                                    </span>
                                                    {isTv && seasons.length > 0 && (
                                                        <span className="text-zinc-400 text-xs font-semibold">
                                                            {seasons.length} Seasons
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
                                                    {movie.title}
                                                </h2>
                                                <AvailabilityBadge movie={movie} />
                                                <div className="flex items-center gap-3 text-sm text-zinc-300">
                                                    {movie.rating > 0 && <span className="font-semibold text-zinc-200">★ {movie.rating.toFixed(1)}</span>}
                                                    <span>{movie.year}</span>
                                                    <span className="border border-white/20 px-1.5 py-0.2 rounded text-[10px] text-zinc-400 font-bold uppercase">
                                                        HD
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                                <button
                                                    onClick={() => handlePlayMovie()}
                                                    className="btn-primary flex items-center gap-2"
                                                >
                                                    <Play size={18} fill="currentColor" />
                                                    Play Now
                                                </button>
                                                <button
                                                    onClick={handleAddToList}
                                                    disabled={isLoading}
                                                    className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all hover:scale-105 ${isFavorite
                                                        ? 'border-slate-500 bg-slate-500/20 text-slate-400'
                                                        : 'border-white/15 hover:border-white text-zinc-400 hover:text-white bg-black/40'
                                                        }`}
                                                    title={isFavorite ? 'Remove from My List' : 'Add to My List'}
                                                >
                                                    <Plus size={18} className={isFavorite ? 'rotate-45' : ''} />
                                                </button>
                                                <button
                                                    onClick={handleLike}
                                                    className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all hover:scale-105 ${isLiked
                                                        ? 'border-green-500 bg-green-500/20 text-green-400'
                                                        : 'border-white/15 hover:border-white text-zinc-400 hover:text-white bg-black/40'
                                                        }`}
                                                    title={isLiked ? 'Unlike' : 'Like'}
                                                >
                                                    <ThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} />
                                                </button>
                                                <button
                                                    onClick={() => setShowWatchParty(true)}
                                                    className="w-11 h-11 rounded-xl border border-white/15 hover:border-slate-400 text-zinc-400 hover:text-slate-300 flex items-center justify-center transition-all bg-black/40 hover:scale-105"
                                                    title="Watch Party"
                                                >
                                                    <Users size={18} />
                                                </button>
                                            </div>

                                            {/* Synopsis */}
                                            <div className="space-y-1.5 pt-2">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                                    Synopsis
                                                </h3>
                                                <p className="text-zinc-300 text-sm leading-relaxed line-clamp-4">
                                                    {movie.description}
                                                </p>
                                            </div>

                                            {/* Genres */}
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {(Array.isArray(movie.genre) ? movie.genre : [movie.genre]).map((g, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium"
                                                    >
                                                        {g}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* TV Series Season & Episode Browser (Bingr.one Style) */}
                                    {isTv && (
                                        <div className="p-6 md:p-8 border-t border-white/10 bg-black/30 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                    <Film size={18} className="text-slate-400" />
                                                    Episodes
                                                </h3>

                                                {/* Season Pills */}
                                                <div className="flex items-center gap-1.5 overflow-x-auto max-w-md scrollbar-none py-1">
                                                    {seasons.length > 0 ? (
                                                        seasons.map(s => (
                                                            <button
                                                                key={s.id || s.seasonNumber}
                                                                onClick={() => setSelectedSeason(s.seasonNumber)}
                                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedSeason === s.seasonNumber
                                                                    ? 'bg-slate-600 text-white shadow-md shadow-slate-600/30'
                                                                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                                                                    }`}
                                                            >
                                                                {s.name}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-zinc-500">Season 1</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Episodes Grid */}
                                            {isLoadingEpisodes ? (
                                                <div className="py-12 text-center text-zinc-500 text-xs">
                                                    Loading episodes...
                                                </div>
                                            ) : episodes.length === 0 ? (
                                                <div className="py-8 text-center text-zinc-500 text-xs">
                                                    Click "Play Now" to start Season {selectedSeason}.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                                                    {episodes.map(ep => (
                                                        <div
                                                            key={ep.id || ep.episodeNumber}
                                                            onClick={() => handlePlayMovie(selectedSeason, ep.episodeNumber)}
                                                            className="flex gap-3 p-2.5 rounded-xl bg-zinc-900/40 hover:bg-slate-950/30 border border-white/5 hover:border-slate-500/40 transition-all cursor-pointer group"
                                                        >
                                                            <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-black/60 flex-shrink-0">
                                                                {ep.stillUrl ? (
                                                                    <img
                                                                        src={ep.stillUrl}
                                                                        alt={ep.name}
                                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 text-[10px]">
                                                                        EP {ep.episodeNumber}
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <Play size={16} fill="white" className="text-white" />
                                                                </div>
                                                                <span className="absolute bottom-1 left-1 bg-black/80 px-1 rounded text-[9px] font-bold text-white">
                                                                    EP {ep.episodeNumber}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                <h4 className="text-xs font-bold text-white group-hover:text-slate-300 truncate">
                                                                    {ep.name}
                                                                </h4>
                                                                {ep.runtime && (
                                                                    <span className="text-[10px] text-zinc-500 mt-0.5">
                                                                        {ep.runtime} mins
                                                                    </span>
                                                                )}
                                                                {ep.overview && (
                                                                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1">
                                                                        {ep.overview}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Watch Party Modal */}
            <WatchPartyModal
                isOpen={showWatchParty}
                onClose={() => setShowWatchParty(false)}
                movieId={(movie?._id as unknown) as string}
                movieTitle={movie?.title || ''}
                onJoinParty={handleJoinParty}
            />
        </>,
        document.body
    );
}
