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
            className="flex-none w-[170px] md:w-[230px] aspect-[2/3] relative rounded-2xl overflow-hidden cursor-pointer group neo-glass border border-white/5"
            onClick={() => onPlay(movie)}
            whileHover={{
                scale: 1.04,
                y: -8,
                boxShadow: '0 20px 40px rgba(147, 51, 234, 0.35)',
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/30 opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/30 via-transparent to-brand-pink/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            {/* Movie Poster */}
            <motion.img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
                layoutId={`poster-${movie._id}`}
            />

            {/* Hover Content */}
            <motion.div
                className="absolute inset-0 p-4 flex flex-col justify-end"
                initial={{ opacity: 0, y: 30 }}
                whileHover={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <div className="flex items-center gap-2 mb-3">
                    <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <Play size={18} fill="currentColor" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/30 text-white flex items-center justify-center hover:border-white hover:bg-white/20 transition-all">
                        <Plus size={18} />
                    </button>
                </div>
                <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm md:text-base leading-tight line-clamp-2">
                        {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-200">
                        <span className="text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/30">95% Match</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20">{movie.year}</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
