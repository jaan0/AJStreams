'use client';

import { motion } from 'framer-motion';
import { Play, Plus } from 'react-feather';
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
            className="flex-none w-[160px] md:w-[220px] aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => onPlay(movie)}
            whileHover={{
                scale: 1.05,
                y: -10,
                boxShadow: '0 0 30px rgba(147, 51, 234, 0.6)',
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            {/* Movie Poster */}
            <motion.img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
                layoutId={`poster-${movie._id}`}
            />

            {/* Hover Content */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 p-4 glass-pane"
                initial={{ opacity: 0, y: '100%' }}
                whileHover={{ opacity: 1, y: '0%' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <div className="flex items-center gap-2 mb-3">
                    <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <Play size={18} fill="currentColor" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-transparent border-2 border-white/20 text-white flex items-center justify-center hover:border-white hover:bg-white/10 transition-all">
                        <Plus size={18} />
                    </button>
                </div>
                <h3 className="font-bold text-white text-sm md:text-base leading-tight mb-2 line-clamp-2">
                    {movie.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <span className="text-green-400 font-bold">95% Match</span>
                    <span>•</span>
                    <span>{movie.year}</span>
                </div>
            </motion.div>
        </motion.div>
    );
}
