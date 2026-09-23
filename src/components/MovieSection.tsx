'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'react-feather';
import { IMovie } from '@/models/Movie';
import { motion } from 'framer-motion';
import MovieCard from './MovieCard';

interface MovieSectionProps {
    title: string;
    movies: IMovie[];
    onPlay: (movie: IMovie) => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function MovieSection({ title, movies, onPlay }: MovieSectionProps) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === 'left'
                ? scrollLeft - clientWidth * 0.8
                : scrollLeft + clientWidth * 0.8;
            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-3 py-4 md:py-6">
            <h2 className="text-lg md:text-2xl font-bold text-white px-4 md:px-12 flex items-center gap-2 md:gap-3">
                <span className="w-1 h-5 md:h-6 bg-gradient-brand rounded-full flex-shrink-0" />
                {title}
            </h2>

            <div className="relative group">
                {/* Left scroll button — desktop only (hidden on touch) */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-1 md:left-4 top-0 bottom-0 z-20 w-10 md:w-12 items-center justify-center hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-label="Scroll left"
                >
                    <div className="bg-black/70 backdrop-blur-sm rounded-full p-2 md:p-2.5 hover:bg-black/90 hover:scale-110 transition-all border border-white/20 shadow-lg">
                        <ChevronLeft className="text-white" size={22} />
                    </div>
                </button>

                {/* Scrollable row */}
                <motion.div
                    ref={rowRef}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    /* px-4 on mobile (matches page padding), px-12 on desktop */
                    className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-4 md:pb-8 pt-2 snap-x px-4 md:px-12"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {movies.map((movie) => (
                        <MovieCard
                            key={(movie._id as unknown) as string}
                            movie={movie}
                            onPlay={onPlay}
                        />
                    ))}
                </motion.div>

                {/* Right scroll button — desktop only */}
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-1 md:right-4 top-0 bottom-0 z-20 w-10 md:w-12 items-center justify-center hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-label="Scroll right"
                >
                    <div className="bg-black/70 backdrop-blur-sm rounded-full p-2 md:p-2.5 hover:bg-black/90 hover:scale-110 transition-all border border-white/20 shadow-lg">
                        <ChevronRight className="text-white" size={22} />
                    </div>
                </button>
            </div>
        </div>
    );
}
