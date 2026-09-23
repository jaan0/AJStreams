'use client';

import { motion } from 'framer-motion';
import { Play } from 'react-feather';
import { IMovie } from '@/models/Movie';

interface MovieCardProps {
    movie: IMovie;
    onPlay: (movie: IMovie) => void;
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function MovieCard({ movie, onPlay }: MovieCardProps) {
    return (
        <motion.div
            variants={cardVariants}
            className="flex-none w-[140px] sm:w-[170px] md:w-[220px] aspect-[2/3] relative rounded-xl overflow-hidden cursor-pointer group select-none"
            onClick={() => onPlay(movie)}
            /* Desktop: hover lift. Mobile: no hover needed, tap is enough */
            whileHover={{ scale: 1.05, y: -8, boxShadow: '0 0 28px rgba(147, 51, 234, 0.55)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
        >
            {/* Movie Poster */}
            <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
                loading="lazy"
                draggable={false}
            />

            {/* Gradient bottom overlay — always slightly visible, more on hover */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 opacity-70 group-hover:opacity-100" />

            {/* Title (always visible on mobile) */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5 md:p-3 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="font-bold text-white text-xs md:text-sm leading-tight line-clamp-2">
                    {movie.title}
                </h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">{movie.year}</p>
            </div>

            {/* Play button — appears on hover on desktop, always on mobile tap area */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center">
                    <Play size={20} fill="white" className="text-white ml-0.5" />
                </div>
            </div>
        </motion.div>
    );
}
