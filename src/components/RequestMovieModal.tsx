'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Film, Calendar, User, Mail } from 'react-feather';

interface RequestMovieModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RequestMovieModal({
    isOpen,
    onClose,
}: RequestMovieModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        releaseYear: '',
        name: '',
        email: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/movie-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setFormData({ title: '', releaseYear: '', name: '', email: '' });
                    onClose();
                }, 2000);
            } else {
                setError('Failed to submit request');
            }
        } catch (error) {
            setError('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm w-full max-w-md z-[101]"
                    >
                        <div className="bg-zinc-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h2 className="text-xl font-bold text-white">Request a Movie</h2>
                                <button
                                    onClick={onClose}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8">
                                {success ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Film size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            Request Submitted!
                                        </h3>
                                        <p className="text-zinc-400">
                                            We'll try to add this movie soon.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                                Movie Title
                                            </label>
                                            <div className="relative group">
                                                <Film
                                                    size={18}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-purple transition-colors"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, title: e.target.value })
                                                    }
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all"
                                                    placeholder="e.g. Inception"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                                Your Name
                                            </label>
                                            <div className="relative group">
                                                <User
                                                    size={18}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-purple transition-colors"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, name: e.target.value })
                                                    }
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all"
                                                    placeholder="Your Name"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                                Your Email
                                            </label>
                                            <div className="relative group">
                                                <Mail
                                                    size={18}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-purple transition-colors"
                                                />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, email: e.target.value })
                                                    }
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all"
                                                    placeholder="your@email.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                                Release Year (Optional)
                                            </label>
                                            <div className="relative group">
                                                <Calendar
                                                    size={18}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-purple transition-colors"
                                                />
                                                <input
                                                    type="number"
                                                    value={formData.releaseYear}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            releaseYear: e.target.value,
                                                        })
                                                    }
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all"
                                                    placeholder="e.g. 2010"
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold hover:opacity-90 transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-purple-500/25"
                                        >
                                            {isLoading ? 'Submitting...' : 'Submit Request'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
