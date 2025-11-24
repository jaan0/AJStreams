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
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export default function MovieSection({
    title,
    movies,
    onPlay,
}: MovieSectionProps) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo =
                direction === 'left'
                    ? scrollLeft - clientWidth
                    : scrollLeft + clientWidth;
            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-4 py-6">
            <h2 className="text-xl md:text-2xl font-bold text-white px-4 md:px-12 flex items-center gap-3">
                <span className="w-1 h-6 bg-gradient-brand rounded-full"></span>
                {title}
            </h2>

            <div className="relative group px-4 md:px-12">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 md:left-8 top-0 bottom-0 z-40 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-label="Scroll left"
                >
                    <div className="bg-black/70 backdrop-blur-sm rounded-full p-2.5 hover:bg-black/90 hover:scale-110 transition-all border border-white/20 shadow-lg">
                        <ChevronLeft className="text-white" size={24} />
                    </div>
                </button>

                <motion.div
                    ref={rowRef}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-8 pt-2 snap-x"
                >
                    {movies.map((movie) => (
                        <MovieCard
                            key={(movie._id as unknown) as string}
                            movie={movie}
                            onPlay={onPlay}
                        />
                    ))}
                </motion.div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 md:right-8 top-0 bottom-0 z-40 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    aria-label="Scroll right"
                >
                    <div className="bg-black/70 backdrop-blur-sm rounded-full p-2.5 hover:bg-black/90 hover:scale-110 transition-all border border-white/20 shadow-lg">
                        <ChevronRight className="text-white" size={24} />
                    </div>
                </button>
            </div>
        </div>
    );
}
