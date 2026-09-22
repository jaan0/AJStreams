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
        <div className="relative h-[70vh] w-full overflow-hidden">
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
                        className="h-full w-full object-cover filter blur-2xl scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4 md:px-12">
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
                        <div className="flex gap-2">
                            {currentMovie.genre.slice(0, 3).map((g, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 md:px-3 md:py-1.5 rounded-full glass border border-white/20 text-[10px] md:text-xs font-bold uppercase tracking-wider"
                                >
                                    {g}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-3xl md:text-6xl font-black drop-shadow-2xl tracking-tight leading-tight">
                            {currentMovie.title}
                        </h1>
                        <div className="flex items-center gap-4 text-zinc-300 text-sm font-medium">
                            <span className="text-green-400 font-bold text-base">98% Match</span>
                            <span>{currentMovie.year}</span>
                            <span className="px-2 py-0.5 border border-zinc-500 rounded text-xs">HD</span>
                        </div>
                        <p className="text-lg md:text-xl text-zinc-200 line-clamp-3 leading-relaxed drop-shadow-md max-w-xl">
                            {currentMovie.description}
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <button
                                onClick={() => onPlay(currentMovie)}
                                className="btn-primary flex items-center gap-3"
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
                        <div className="relative w-[200px] md:w-[300px] aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
                            <img
                                src={currentMovie.posterUrl}
                                alt={currentMovie.title}
                                className="h-full w-full object-contain"
                            />
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
                            className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-white' : 'bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
        </div>
    );
}
