'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User } from 'react-feather';
import { createPortal } from 'react-dom';
import { signIn } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isLogin) {
                const res = await signIn('credentials', {
                    redirect: false,
                    email: formData.email,
                    password: formData.password,
                });

                if (res?.error) {
                    setError('Invalid email or password');
                } else {
                    onClose();
                }
            } else {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.message || 'Something went wrong');
                } else {
                    // Auto login after signup
                    await signIn('credentials', {
                        redirect: false,
                        email: formData.email,
                        password: formData.password,
                    });
                    onClose();
                }
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm w-full max-w-md z-[101] p-4"
                    >
                        <div className="bg-zinc-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                            {/* Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h2 className="text-xl font-bold text-white">
                                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-pink">MyFlix</span>
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-white/10">
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className={cn(
                                        'flex-1 py-4 text-sm font-medium transition-colors relative',
                                        isLogin ? 'text-white bg-white/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    )}
                                >
                                    Sign In
                                    {isLogin && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-purple to-brand-pink"
                                        />
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className={cn(
                                        'flex-1 py-4 text-sm font-medium transition-colors relative',
                                        !isLogin ? 'text-white bg-white/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                    )}
                                >
                                    Sign Up
                                    {!isLogin && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-purple to-brand-pink"
                                        />
                                    )}
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {!isLogin && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                            Name
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
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Email
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
                                            placeholder="you@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Password
                                    </label>
                                    <div className="relative group">
                                        <Lock
                                            size={18}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-purple transition-colors"
                                        />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple/50 transition-all"
                                            placeholder="••••••••"
                                            required
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
                                    {isLoading
                                        ? 'Please wait...'
                                        : isLogin
                                            ? 'Sign In'
                                            : 'Create Account'}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
