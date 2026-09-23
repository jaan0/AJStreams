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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (movies.length > 1) {
            const timer = setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % movies.length);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [currentIndex, movies.length]);

    if (!movies || movies.length === 0) return null;

    const currentMovie = movies[currentIndex];

    return (
        /* Use dvh so hero doesn't get cut off by mobile browser bars */
        <div className="relative w-full overflow-hidden" style={{ height: isMobile ? '88svh' : '70vh' }}>
            {/* Background Image with crossfade */}
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
                        loading="eager"
                    />
                    {/* Stronger gradient on mobile so text is legible */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30 md:bg-black/60 md:bg-none"
                         style={{ background: isMobile
                             ? 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.85) 40%, rgba(10,10,10,0.4) 100%)'
                             : 'rgba(0,0,0,0.6)'
                         }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-end md:justify-center">
                <div className="px-4 md:px-12 pb-12 md:pb-0 md:grid md:grid-cols-2 md:gap-8 md:items-center">
                    {/* Left Side: Movie Info */}
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="space-y-3 md:space-y-6 text-white"
                    >
                        {/* Genre badges */}
                        <div className="flex flex-wrap gap-1.5">
                            {currentMovie.genre.slice(0, 2).map((g, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 rounded-full glass border border-white/20 text-[10px] md:text-xs font-bold uppercase tracking-wider"
                                >
                                    {g}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black drop-shadow-2xl tracking-tight leading-tight">
                            {currentMovie.title}
                        </h1>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 text-zinc-300 text-xs md:text-sm font-medium">
                            <span className="text-green-400 font-bold text-sm md:text-base">98% Match</span>
                            <span>{currentMovie.year}</span>
                            <span className="px-1.5 py-0.5 border border-zinc-500 rounded text-[10px]">HD</span>
                        </div>

                        {/* Description — hidden on small mobile, shown on sm+ */}
                        <p className="hidden sm:block text-sm md:text-lg text-zinc-200 line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-md max-w-xl">
                            {currentMovie.description}
                        </p>

                        {/* Buttons */}
                        <div className="flex items-center gap-3 pt-2 md:pt-4">
                            <button
                                onClick={() => onPlay(currentMovie)}
                                className="flex items-center gap-2 px-5 py-3 md:px-8 md:py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl md:rounded-button text-sm md:text-base hover:scale-105 hover:shadow-glow transition-all duration-300 shadow-lg touch-btn"
                            >
                                <Play fill="currentColor" size={18} />
                                <span className="hidden xs:inline">Play Now</span>
                                <span className="xs:hidden">Play</span>
                            </button>
                            <button
                                onClick={() => onMoreInfo(currentMovie)}
                                className="flex items-center gap-2 px-4 py-3 md:px-8 md:py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl md:rounded-button text-sm md:text-base border border-white/20 hover:scale-105 transition-all duration-300 touch-btn"
                            >
                                <Info size={18} />
                                <span className="hidden xs:inline">More Info</span>
                                <span className="xs:hidden">Info</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* Right Side: Poster — only shown on md+ */}
                    <motion.div
                        key={currentIndex + '-poster'}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="hidden md:flex justify-center items-center"
                    >
                        <div className="relative w-[240px] lg:w-[300px] aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                            <img
                                src={currentMovie.posterUrl}
                                alt={currentMovie.title}
                                className="h-full w-full object-cover"
                                loading="eager"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Carousel Dots */}
            {movies.length > 1 && (
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {movies.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`rounded-full transition-all ${
                                currentIndex === index
                                    ? 'bg-white w-6 h-2'
                                    : 'bg-white/40 w-2 h-2 hover:bg-white/70'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>
    );
}
