'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Play } from 'react-feather';
import Link from 'next/link';
import { IMovie } from '@/models/Movie';
import MovieDetailsModal from './MovieDetailsModal';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<IMovie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [playingMovie, setPlayingMovie] = useState<IMovie | null>(null);
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
                setResults(data);
            } catch (error) {
                console.error('Search failed', error);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(searchMovies, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-0 left-0 right-0 z-[70] p-4 md:p-8"
                    >
                        <div className="max-w-3xl mx-auto bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                            <div className="flex items-center px-4 py-3 border-b border-white/10">
                                <Search className="text-zinc-400" size={20} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search titles, genres..."
                                    className="flex-1 bg-transparent border-none text-white px-4 py-2 focus:outline-none placeholder:text-zinc-500"
                                />
                                <button onClick={onClose} className="text-zinc-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto p-4">
                                {isLoading ? (
                                    <div className="text-center py-8 text-zinc-500">Searching...</div>
                                ) : results.length > 0 ? (
                                    <div className="grid gap-4">
                                        {results.map((movie) => (
                                            <div
                                                key={(movie._id as unknown) as string}
                                                className="flex gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer"
                                                onClick={() => setPlayingMovie(movie)}
                                            >
                                                <img
                                                    src={movie.posterUrl}
                                                    alt={movie.title}
                                                    className="w-16 h-24 object-cover rounded"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                                        {movie.title}
                                                    </h4>
                                                    <p className="text-sm text-zinc-400">{movie.year}</p>
                                                    <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                                                        {movie.description}
                                                    </p>
                                                </div>
                                                <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="p-2 bg-purple-600 rounded-full text-white">
                                                        <Play size={16} fill="currentColor" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : query ? (
                                    <div className="text-center py-8 text-zinc-500">
                                        No results found for "{query}"
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-zinc-500">
                                        Type to search for movies
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {playingMovie && (
                        <MovieDetailsModal
                            movie={playingMovie}
                            onClose={() => setPlayingMovie(null)}
                        />
                    )}
                </>
            )}
        </AnimatePresence>
    );
}
