'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Plus, ThumbsUp, Users } from 'react-feather';
import { createPortal } from 'react-dom';
import { IMovie } from '@/models/Movie';
import { useState } from 'react';
import VideoPlayer from './VideoPlayer';
import WatchPartyModal from './WatchPartyModal';

interface MovieDetailsModalProps {
    movie: IMovie | null;
    onClose: () => void;
}

export default function MovieDetailsModal({ movie, onClose }: MovieDetailsModalProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showWatchParty, setShowWatchParty] = useState(false);
    const [watchPartyId, setWatchPartyId] = useState<string | null>(null);

    if (!movie) return null;

    // Add to favorites/my list
    const handleAddToList = async () => {
        setIsLoading(true);
        try {
            const method = isFavorite ? 'DELETE' : 'POST';
            const res = await fetch('/api/user/favorites', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movieId: movie._id }),
            });

            if (res.ok) {
                setIsFavorite(!isFavorite);
            } else {
                const data = await res.json();
                alert(data.error || 'Please login to add to your list');
            }
        } catch (error) {
            console.error('Failed to update favorites', error);
            alert('Failed to update list. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle like (just visual for now, can be extended to API)
    const handleLike = () => {
        setIsLiked(!isLiked);
    };

    const handleJoinParty = (partyId: string) => {
        // Redirect to the movie page with the party ID
        // This ensures the host is also connected to the socket server
        window.location.href = `/movie/${movie._id}?party=${partyId}`;
    };

    if (isPlaying) {
        return (
            <VideoPlayer
                videoUrl={movie.videoUrl}
                title={movie.title}
                onClose={() => setIsPlaying(false)}
            />
        );
    }

    return createPortal(
        <>
            <AnimatePresence>
                {movie && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                        >
                            <div className="modal-bg shadow-2xl overflow-hidden w-full max-w-5xl max-h-[90vh]">
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-sm flex items-center justify-center text-white transition-all border border-white/20 hover:scale-110"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex flex-col md:flex-row max-h-[90vh] overflow-y-auto scrollbar-hide">
                                    {/* Left: Poster */}
                                    <div className="md:w-2/5 flex-shrink-0 relative">
                                        <div className="aspect-[2/3] md:aspect-auto md:h-full relative">
                                            <img
                                                src={movie.posterUrl}
                                                alt={movie.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-zinc-900" />
                                        </div>
                                    </div>

                                    {/* Right: Details */}
                                    <div className="flex-1 p-8 md:p-10 space-y-6 relative">
                                        {/* Title */}
                                        <div className="space-y-3">
                                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                                                {movie.title}
                                            </h2>

                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="text-green-400 font-bold text-base">98% Match</span>
                                                <span className="text-zinc-400 font-medium">{movie.year}</span>
                                                <span className="border border-zinc-600 px-2 py-0.5 rounded text-xs text-zinc-400 font-medium">HD</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setIsPlaying(true)}
                                                className="flex items-center gap-2 px-6 md:px-8 py-3 bg-white text-black rounded-lg font-bold hover:bg-zinc-200 transition-all transform hover:scale-105 shadow-lg"
                                            >
                                                <Play size={20} fill="currentColor" />
                                                Play
                                            </button>
                                            <button
                                                onClick={handleAddToList}
                                                disabled={isLoading}
                                                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${isFavorite
                                                    ? 'border-brand-purple bg-brand-purple/20 text-brand-purple'
                                                    : 'border-zinc-600 hover:border-white text-zinc-400 hover:text-white bg-black/40 hover:bg-black/60'
                                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={isFavorite ? 'Remove from My List' : 'Add to My List'}
                                            >
                                                <Plus size={18} className={isFavorite ? 'rotate-45' : ''} />
                                            </button>
                                            <button
                                                onClick={handleLike}
                                                className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${isLiked
                                                    ? 'border-green-500 bg-green-500/20 text-green-500'
                                                    : 'border-zinc-600 hover:border-white text-zinc-400 hover:text-white bg-black/40 hover:bg-black/60'
                                                    }`}
                                                title={isLiked ? 'Unlike' : 'Like'}
                                            >
                                                <ThumbsUp size={18} fill={isLiked ? 'currentColor' : 'none'} />
                                            </button>
                                            <button
                                                onClick={() => setShowWatchParty(true)}
                                                className="w-11 h-11 rounded-full border-2 border-zinc-600 hover:border-brand-purple text-zinc-400 hover:text-brand-purple flex items-center justify-center transition-all bg-black/40 hover:bg-brand-purple/20 hover:scale-110"
                                                title="Watch Party"
                                            >
                                                <Users size={18} />
                                            </button>
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Synopsis</h3>
                                            <p className="text-zinc-300 text-base leading-relaxed">
                                                {movie.description}
                                            </p>
                                        </div>

                                        {/* Metadata */}
                                        <div className="space-y-3 pt-4 border-t border-white/10">
                                            <div className="flex items-start gap-2">
                                                <span className="text-zinc-500 font-medium min-w-[80px]">Genres:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {(Array.isArray(movie.genre) ? movie.genre : [movie.genre]).map((g, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-3 py-1 rounded-full bg-gradient-to-r from-brand-purple/20 to-brand-pink/20 border border-brand-purple/30 text-brand-purple text-xs font-bold"
                                                        >
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-zinc-500 font-medium min-w-[80px]">Language:</span>
                                                <span className="text-zinc-300">English</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-zinc-500 font-medium min-w-[80px]">Quality:</span>
                                                <span className="text-zinc-300">4K Ultra HD</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Watch Party Modal */}
            <WatchPartyModal
                isOpen={showWatchParty}
                onClose={() => setShowWatchParty(false)}
                movieId={(movie?._id as unknown) as string}
                movieTitle={movie?.title || ''}
                onJoinParty={handleJoinParty}
            />
        </>,
        document.body
    );
}
