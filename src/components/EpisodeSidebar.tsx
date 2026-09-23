'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Play, ChevronDown, Check, Clock, Calendar,
    Star, Layers, ArrowRight, Loader, Film
} from 'react-feather';

export interface EpisodeItem {
    id: number;
    episodeNumber: number;
    name: string;
    overview: string;
    runtime: number | null;
    stillUrl: string | null;
    airDate: string;
    rating: number | null;
}

export interface SeasonInfo {
    id: number;
    name: string;
    seasonNumber: number;
    episodeCount: number;
    posterUrl: string | null;
}

interface EpisodeSidebarProps {
    tmdbId: string;
    currentSeason: number;
    currentEpisode: number;
    isOpen: boolean;
    onClose: () => void;
    onSelectEpisode: (season: number, episode: number) => void;
    seriesTitle?: string;
    availableSeasons?: SeasonInfo[];
}

export default function EpisodeSidebar({
    tmdbId,
    currentSeason,
    currentEpisode,
    isOpen,
    onClose,
    onSelectEpisode,
    seriesTitle = 'Episodes',
    availableSeasons = [],
}: EpisodeSidebarProps) {
    const [selectedSeason, setSelectedSeason] = useState<number>(currentSeason || 1);
    const [seasons, setSeasons] = useState<SeasonInfo[]>(availableSeasons);
    const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
    const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
    const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
    const [quickJumpInput, setQuickJumpInput] = useState('');

    // Synchronize when currentSeason changes
    useEffect(() => {
        if (currentSeason) {
            setSelectedSeason(currentSeason);
        }
    }, [currentSeason]);

    // Fetch seasons if not passed in
    useEffect(() => {
        if (!tmdbId) return;
        if (seasons.length > 0) return;

        const fetchShowDetails = async () => {
            try {
                const res = await fetch(`/api/tmdb/tv/${tmdbId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.seasons && data.seasons.length > 0) {
                        setSeasons(data.seasons);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch series seasons:', err);
            }
        };

        fetchShowDetails();
    }, [tmdbId, seasons.length]);

    // Fetch episodes whenever selectedSeason or tmdbId changes
    useEffect(() => {
        if (!tmdbId || !selectedSeason) return;

        const fetchEpisodes = async () => {
            setIsLoadingEpisodes(true);
            try {
                const res = await fetch(`/api/tmdb/tv/${tmdbId}/season/${selectedSeason}`);
                if (res.ok) {
                    const data = await res.json();
                    setEpisodes(data.episodes || []);
                } else {
                    setEpisodes([]);
                }
            } catch (err) {
                console.error('Failed to fetch season episodes:', err);
                setEpisodes([]);
            } finally {
                setIsLoadingEpisodes(false);
            }
        };

        fetchEpisodes();
    }, [tmdbId, selectedSeason]);

    // Quick jump submit
    const handleQuickJump = (e: React.FormEvent) => {
        e.preventDefault();
        const epNum = parseInt(quickJumpInput.trim(), 10);
        if (!isNaN(epNum) && epNum > 0) {
            onSelectEpisode(selectedSeason, epNum);
            setQuickJumpInput('');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* === MOBILE: Bottom Sheet === */}
            <div className="md:hidden fixed inset-0 z-[75] flex flex-col justify-end">
                {/* Mobile backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />
                {/* Bottom Sheet panel */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                    className="relative w-full bg-zinc-950 border-t border-white/10 rounded-t-3xl flex flex-col shadow-2xl overflow-hidden"
                    style={{ height: '85svh', maxHeight: '85svh' }}
                >
                    {/* Drag handle */}
                    <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                        <div className="w-10 h-1 rounded-full bg-zinc-600" />
                    </div>
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 bg-[#121215] relative z-40">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="p-1.5 rounded-lg bg-slate-500/20 text-slate-400 border border-slate-500/30">
                                    <Layers size={16} />
                                </span>
                                <h3 className="text-white font-bold text-base truncate">
                                    {seriesTitle}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                title="Close sidebar"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Season Selector & Quick Jump */}
                        <div className="flex items-center gap-2">
                            {/* Season Dropdown */}
                            <div className="relative flex-1">
                                <button
                                    type="button"
                                    onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-black/80 hover:bg-black border border-white/15 hover:border-slate-500/60 rounded-xl text-white text-xs font-semibold transition-all shadow-inner"
                                >
                                    <span className="flex items-center gap-2 truncate">
                                        <Film size={14} className="text-slate-400 flex-shrink-0" />
                                        <span>
                                            {seasons.find(s => s.seasonNumber === selectedSeason)?.name || `Season ${selectedSeason}`}
                                        </span>
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        className={`text-zinc-400 transition-transform ${seasonDropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Dropdown menu */}
                                <AnimatePresence>
                                    {seasonDropdownOpen && (
                                        <>
                                            {/* Click outside backdrop */}
                                            <div
                                                className="fixed inset-0 z-[95]"
                                                onClick={() => setSeasonDropdownOpen(false)}
                                            />

                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                className="absolute top-full left-0 right-0 mt-1.5 py-1.5 bg-[#18181c] border border-zinc-700/80 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.98)] z-[100] max-h-60 overflow-y-auto ring-1 ring-white/10"
                                            >
                                                {seasons.length > 0 ? (
                                                    seasons.map(s => (
                                                        <button
                                                            key={s.id || s.seasonNumber}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSeason(s.seasonNumber);
                                                                setSeasonDropdownOpen(false);
                                                            }}
                                                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors ${selectedSeason === s.seasonNumber
                                                                ? 'bg-slate-600 text-white font-bold'
                                                                : 'text-zinc-200 hover:bg-white/10 hover:text-white'
                                                                }`}
                                                        >
                                                            <span>{s.name}</span>
                                                            <span className={`text-[10px] ${selectedSeason === s.seasonNumber ? 'text-slate-200' : 'text-zinc-400'}`}>
                                                                {s.episodeCount ? `${s.episodeCount} eps` : ''}
                                                            </span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSeason(num);
                                                                setSeasonDropdownOpen(false);
                                                            }}
                                                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition-colors ${selectedSeason === num
                                                                ? 'bg-slate-600 text-white font-bold'
                                                                : 'text-zinc-200 hover:bg-white/10 hover:text-white'
                                                                }`}
                                                        >
                                                            <span>Season {num}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Quick Jump Input */}
                            <form onSubmit={handleQuickJump} className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Jump to Ep #"
                                    value={quickJumpInput}
                                    onChange={e => setQuickJumpInput(e.target.value)}
                                    className="w-24 px-2.5 py-2 bg-black/80 border border-white/15 focus:border-slate-500/60 rounded-xl text-white text-xs placeholder:text-zinc-500 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!quickJumpInput.trim()}
                                    className="px-2.5 py-2 bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center"
                                    title="Jump to episode"
                                >
                                    <ArrowRight size={13} />
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Episodes List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800">
                        {isLoadingEpisodes ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                                <Loader size={28} className="animate-spin text-slate-500 mb-2" />
                                <p className="text-xs">Loading season episodes...</p>
                            </div>
                        ) : episodes.length === 0 ? (
                            <div className="text-center py-16 px-4 text-zinc-500">
                                <Film size={36} className="mx-auto mb-2 opacity-30" />
                                <p className="text-xs font-semibold text-zinc-400 mb-1">
                                    No episode list available from TMDB
                                </p>
                                <p className="text-[11px] text-zinc-500 mb-3">
                                    You can still use the Quick Jump box above to play any episode number.
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {Array.from({ length: 16 }, (_, i) => i + 1).map(epNum => (
                                        <button
                                            key={epNum}
                                            onClick={() => onSelectEpisode(selectedSeason, epNum)}
                                            className={`p-2 rounded-xl text-xs font-bold border transition-all ${epNum === currentEpisode && selectedSeason === currentSeason
                                                ? 'bg-slate-600 border-slate-400 text-white'
                                                : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                                                }`}
                                        >
                                            EP {epNum}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            episodes.map(ep => {
                                const isCurrent =
                                    ep.episodeNumber === currentEpisode &&
                                    selectedSeason === currentSeason;

                                return (
                                    <div
                                        key={ep.id || ep.episodeNumber}
                                        onClick={() => onSelectEpisode(selectedSeason, ep.episodeNumber)}
                                        className={`group relative flex gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${isCurrent
                                            ? 'bg-slate-950/40 border-slate-500/60 shadow-lg shadow-slate-950/50'
                                            : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-white/5 hover:border-white/15'
                                            }`}
                                    >
                                        {/* Thumbnail with overlay */}
                                        <div className="relative w-28 h-18 rounded-lg overflow-hidden bg-black/60 flex-shrink-0 flex items-center justify-center">
                                            {ep.stillUrl ? (
                                                <img
                                                    src={ep.stillUrl}
                                                    alt={ep.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-950/50 to-zinc-900 flex items-center justify-center">
                                                    <Film size={20} className="text-zinc-600" />
                                                </div>
                                            )}

                                            {/* Hover Play Button */}
                                            <div
                                                className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCurrent ? 'bg-slate-600 text-white' : 'bg-white/90 text-black'}`}>
                                                    <Play size={14} fill="currentColor" className="ml-0.5" />
                                                </div>
                                            </div>

                                            {/* Episode Number Badge */}
                                            <span className="absolute bottom-1 left-1 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-white tracking-wider">
                                                EP {ep.episodeNumber}
                                            </span>
                                        </div>

                                        {/* Episode Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            <div>
                                                <div className="flex items-start justify-between gap-1">
                                                    <h4 className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-slate-300' : 'text-white group-hover:text-slate-200'}`}>
                                                        {ep.name}
                                                    </h4>
                                                    {isCurrent && (
                                                        <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-500/20 border border-slate-500/40 text-[9px] font-bold text-slate-300">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping" />
                                                            PLAYING
                                                        </span>
                                                    )}
                                                </div>

                                                {ep.overview && (
                                                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                                                        {ep.overview}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Metadata pills */}
                                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-1.5">
                                                {ep.runtime && (
                                                    <span className="flex items-center gap-0.5">
                                                        <Clock size={10} /> {ep.runtime}m
                                                    </span>
                                                )}
                                                {ep.airDate && (
                                                    <span className="flex items-center gap-0.5">
                                                        <Calendar size={10} /> {ep.airDate.slice(0, 4)}
                                                    </span>
                                                )}
                                                {ep.rating && (
                                                    <span className="flex items-center gap-0.5 text-amber-400">
                                                        <Star size={10} fill="currentColor" /> {ep.rating}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="p-3 border-t border-white/10 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between text-xs text-zinc-400">
                        <span>
                            Season {selectedSeason} · {episodes.length} Episodes
                        </span>
                        <span className="text-[11px] text-zinc-500">
                            Powered by TMDB
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* === DESKTOP: Right-side Drawer (md+) === */}
            <div className="hidden md:flex fixed inset-y-0 right-0 z-[75]">
                {/* Desktop drawer */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 26, stiffness: 240 }}
                    className="relative w-[420px] lg:w-[460px] h-full bg-zinc-950/95 border-l border-white/10 backdrop-blur-xl flex flex-col shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 bg-[#121215] relative z-40">
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="p-1.5 rounded-lg bg-slate-500/20 text-slate-400 border border-slate-500/30">
                                    <Layers size={16} />
                                </span>
                                <h3 className="text-white font-bold text-base truncate">{seriesTitle}</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-zinc-400">Season {selectedSeason} · Currently watching E{currentEpisode}</p>
                    </div>

                    {/* Episode list — reuse same content */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {isLoadingEpisodes ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3">
                                <Loader className="animate-spin text-slate-400" size={28} />
                                <p className="text-zinc-500 text-sm">Loading episodes...</p>
                            </div>
                        ) : episodes.map((ep) => {
                            const isCurrentEp = ep.episodeNumber === currentEpisode && selectedSeason === currentSeason;
                            return (
                                <button
                                    key={ep.id}
                                    onClick={() => { onSelectEpisode(selectedSeason, ep.episodeNumber); onClose(); }}
                                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                                        isCurrentEp
                                            ? 'bg-slate-600/25 border border-slate-500/40'
                                            : 'hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <div className="relative flex-shrink-0 w-[100px] aspect-video rounded-lg overflow-hidden bg-zinc-800">
                                        {ep.stillUrl ? (
                                            <img src={ep.stillUrl} alt={ep.name} className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Film size={20} className="text-zinc-600" />
                                            </div>
                                        )}
                                        {isCurrentEp && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <Play size={20} fill="white" className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-zinc-500 font-medium">E{ep.episodeNumber}</p>
                                        <p className={`text-xs font-semibold line-clamp-2 ${isCurrentEp ? 'text-slate-300' : 'text-white'}`}>
                                            {ep.name}
                                        </p>
                                        {ep.runtime && (
                                            <p className="text-[10px] text-zinc-500 mt-0.5">{ep.runtime}m</p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="p-3 border-t border-white/10 bg-zinc-900/60 text-xs text-zinc-400 flex justify-between">
                        <span>Season {selectedSeason} · {episodes.length} Episodes</span>
                        <span className="text-zinc-500">Powered by TMDB</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
