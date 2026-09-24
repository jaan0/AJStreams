'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Play, Film, Tv, Star, ArrowRight } from 'react-feather';
import { useRouter } from 'next/navigation';
import { IMovie } from '@/models/Movie';
import { extractBingrTvParams } from '@/lib/embed';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<IMovie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const searchMovies = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(searchMovies, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handlePlayMovie = (movie: IMovie) => {
        onClose();
        const tvParams = extractBingrTvParams(movie.videoUrl);
        if (tvParams.isBingrTv && tvParams.tmdbId) {
            router.push(`/watch/tv/${tvParams.tmdbId}/${tvParams.season || 1}/${tvParams.episode || 1}`);
            return;
        }
        router.push(`/movie/${movie._id}`);
    };

    useEffect(() => {
        if (!isOpen) return;
        const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [isOpen, onClose]);

    // Filter results based on selected filter
    const filteredResults = results.filter(movie => {
        if (filterType === 'all') return true;
        const tvParams = extractBingrTvParams(movie.videoUrl);
        if (filterType === 'tv') return tvParams.isBingrTv;
        if (filterType === 'movie') return !tvParams.isBingrTv;
        return true;
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                    />

                    {/* Search Command Dialog */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        className="pwa-search-shell fixed top-12 left-0 right-0 z-[110] p-4 flex justify-center"
                    >
                        <div role="dialog" aria-modal="true" aria-label="Search library" className="w-full max-w-3xl max-h-[85dvh] bg-[#121216] border border-white/10 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col ring-1 ring-slate-500/20">
                            {/* Search Input Box */}
                            <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-black/40">
                                <Search className="text-slate-400 mr-3 flex-shrink-0" size={20} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search movies, TV series, genres... (e.g. The Boys, Inception)"
                                    className="flex-1 bg-transparent border-none text-white text-sm md:text-base focus:outline-none placeholder:text-zinc-500"
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery('')}
                                        className="text-zinc-500 hover:text-zinc-300 p-1 mr-2 text-xs"
                                    >
                                        Clear
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    aria-label="Close search" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-black/20 text-xs">
                                <span className="text-zinc-500 font-semibold mr-1">Filter:</span>
                                {([
                                    { id: 'all' as const, label: 'All', icon: undefined },
                                    { id: 'movie' as const, label: 'Movies', icon: Film },
                                    { id: 'tv' as const, label: 'TV Shows', icon: Tv },
                                ]).map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setFilterType(tab.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                                                filterType === tab.id
                                                    ? 'bg-slate-600 text-white shadow-sm shadow-slate-600/30'
                                                    : 'bg-white/5 text-zinc-400 hover:text-white'
                                            }`}
                                        >
                                            {Icon && <Icon size={12} />}
                                            {tab.label}
                                        </button>
                                    );
                                })}
                                <span className="ml-auto text-[11px] text-zinc-500">
                                    {filteredResults.length} {filteredResults.length === 1 ? 'title' : 'titles'}
                                </span>
                            </div>

                            {/* Results List */}
                            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
                                {isLoading ? (
                                    <div className="text-center py-12 text-zinc-500 text-xs">
                                        Searching library...
                                    </div>
                                ) : filteredResults.length > 0 ? (
                                    filteredResults.map((movie) => {
                                        const tvParams = extractBingrTvParams(movie.videoUrl);
                                        const isSeries = tvParams.isBingrTv;

                                        return (
                                            <div
                                                key={(movie._id as unknown) as string}
                                                onClick={() => handlePlayMovie(movie)}
                                                className="flex items-center gap-3.5 p-2.5 rounded-xl bg-zinc-900/40 hover:bg-slate-950/30 border border-white/5 hover:border-slate-500/40 transition-all group cursor-pointer"
                                            >
                                                {/* Poster */}
                                                <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-black/60 flex-shrink-0">
                                                    <img
                                                        src={movie.posterUrl}
                                                        alt={movie.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-white text-sm group-hover:text-slate-300 transition-colors truncate">
                                                            {movie.title}
                                                        </h4>
                                                        <span
                                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                                isSeries
                                                                    ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                            }`}
                                                        >
                                                            {isSeries ? 'Series' : 'Movie'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                                                        <span>{movie.year}</span>
                                                        {movie.genre && movie.genre.length > 0 && (
                                                            <span>{(Array.isArray(movie.genre) ? movie.genre : [movie.genre]).slice(0, 2).join(', ')}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-zinc-500 line-clamp-1">
                                                        {movie.description}
                                                    </p>
                                                </div>

                                                {/* Play Button */}
                                                <div className="flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePlayMovie(movie);
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-xs font-bold transition-all shadow-md group-hover:scale-105"
                                                    >
                                                        <Play size={12} fill="white" />
                                                        <span>Play</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : query ? (
                                    <div className="text-center py-12 text-zinc-500 text-xs">
                                        No results found for "{query}"
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-zinc-500 text-xs">
                                        Type a title, genre, or keyword to start searching...
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
