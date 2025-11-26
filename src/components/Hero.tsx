'use client';

import { useState, useEffect } from 'react';
import { Play, Info } from 'react-feather';
import { IMovie } from '@/models/Movie';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
    movies: IMovie[];
    onPlay: (movie: IMovie) => void;
    onMoreInfo: (movie: IMovie) => void;
}

export default function Hero({ movies, onPlay, onMoreInfo }: HeroProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (movies.length > 1) {
            const timer = setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % movies.length);
            }, 4000); // 4-second delay
            return () => clearTimeout(timer);
        }
    }, [currentIndex, movies.length]);

    if (!movies || movies.length === 0) return null;

    const currentMovie = movies[currentIndex];

    const variants = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -30 },
    };

    return (
        <div className="relative h-[80vh] w-full overflow-hidden">
            {/* Background Image */}
            <AnimatePresence initial={false}>
                <motion.div
                    key={currentIndex}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                >
                    <img
                        src={currentMovie.posterUrl}
                        alt={currentMovie.title}
                        className="h-full w-full object-cover filter blur-3xl scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
                    <div className="absolute inset-0 hero-grid opacity-20" />
                </motion.div>
            </AnimatePresence>

            {/* Glow accents */}
            <div className="absolute -left-20 top-10 h-72 w-72 bg-brand-purple/40 blur-[120px]" />
            <div className="absolute -right-16 bottom-10 h-72 w-72 bg-sky-500/40 blur-[120px]" />

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center px-4 md:px-12">
                    {/* Left Side: Movie Info */}
                    <motion.div
                        key={currentIndex}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={variants}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="max-w-2xl space-y-6 text-white"
                    >
                        <div className="flex items-center gap-3">
                            <div className="pill bg-white/20 border-white/20">Premiere</div>
                            <div className="pill text-gradient">Cinematic SaaS Experience</div>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black drop-shadow-2xl tracking-tight leading-tight">
                            {currentMovie.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-zinc-300 text-sm font-medium">
                            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10">{currentMovie.year}</span>
                            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/30 font-semibold">98% Match</span>
                            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20">Dolby Vision</span>
                        </div>
                        <p className="text-lg md:text-xl text-zinc-200 line-clamp-3 leading-relaxed drop-shadow-md max-w-xl">
                            {currentMovie.description}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="neo-glass rounded-xl p-4 border-white/5">
                                <p className="text-xs text-zinc-400">Top genre focus</p>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {currentMovie.genre.slice(0, 3).map((g, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 rounded-full bg-white/10 text-xs font-semibold tracking-wide"
                                        >
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="neo-glass rounded-xl p-4 border-white/5">
                                <p className="text-xs text-zinc-400">Viewership pulse</p>
                                <div className="flex items-center gap-3 mt-2 text-white">
                                    <span className="text-2xl font-bold">24.8k</span>
                                    <span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/30">Live now</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <button
                                onClick={() => onPlay(currentMovie)}
                                className="btn-primary flex items-center gap-3 shadow-glow"
                            >
                                <Play fill="currentColor" size={24} />
                                Play Now
                            </button>
                            <button
                                onClick={() => onMoreInfo(currentMovie)}
                                className="btn-secondary flex items-center gap-3"
                            >
                                <Info size={24} />
                                More Info
                            </button>
                            <div className="text-sm text-zinc-300 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Instant start. No buffering.</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side: Poster (Visible on mobile now) */}
                    <motion.div
                        key={currentIndex + '-poster'}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="flex justify-center items-center mt-8 md:mt-0 order-first md:order-last"
                    >
                        <div className="relative w-[220px] md:w-[360px] aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-hero p-2 glow-ring">
                            <div className="absolute inset-6 rounded-2xl bg-black/40 blur-3xl" />
                            <img
                                src={currentMovie.posterUrl}
                                alt={currentMovie.title}
                                className="relative h-full w-full object-contain rounded-xl"
                            />
                            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-brand-purple/60 via-white/5 to-brand-pink/40 opacity-40 blur-xl" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Carousel Dots */}
            {movies.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {movies.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-white w-6' : 'bg-white/50'}`}
                        />
                    ))}
                </div>
            )}

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
        </div>
    );
}
