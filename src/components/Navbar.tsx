'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Search, User, LogOut, PlusCircle } from 'react-feather';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import AuthModal from './AuthModal';
import RequestMovieModal from './RequestMovieModal';
import SearchModal from './SearchModal';

export default function Navbar() {
    const { data: session } = useSession();
    const [isScrolled, setIsScrolled] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setIsScrolled(latest > 50);
    });

    return (
        <>
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center"
                initial={{
                    backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
                    backgroundColor: 'rgba(10, 10, 10, 0)',
                } as any}
                animate={{
                    backgroundImage: isScrolled ? 'none' : 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
                    backgroundColor: isScrolled ? 'rgba(10, 10, 10, 0.5)' : 'rgba(10, 10, 10, 0)',
                    backdropFilter: isScrolled ? 'blur(16px)' : 'blur(0px)',
                    borderBottom: isScrolled ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0)',
                } as any}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <div className="w-full px-4 md:px-12 flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center gap-8">
                        <Link
                            href="/"
                            className="hover:opacity-80 transition-opacity"
                        >
                            <img src="/logo.png" alt="Logo" className="h-12" />
                        </Link>

                        {/* Navigation Links */}
                        <div className="hidden md:flex gap-6 text-sm font-medium text-zinc-300">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <Link href="/movies" className="hover:text-white transition-colors">Movies</Link>
                            {session && (
                                <>
                                    <Link href="/my-list" className="hover:text-white transition-colors">My List</Link>
                                    <Link href="/watch-parties" className="hover:text-white transition-colors">Watch Parties</Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowSearchModal(true)}
                            className="text-zinc-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                            aria-label="Search"
                        >
                            <Search size={20} />
                        </button>

                        <button
                            onClick={() => setShowRequestModal(true)}
                            className="text-zinc-300 hover:text-brand-purple transition-all flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10"
                        >
                            <PlusCircle size={18} />
                            <span className="hidden md:inline">Request</span>
                        </button>

                        {session ? (
                            <div className="relative">
                                <button onClick={() => setShowProfileMenu(!showProfileMenu)}>
                                    <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold text-sm shadow-glow">
                                        {session.user?.name?.[0] || 'U'}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {showProfileMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute right-0 top-full mt-3 w-56 glass-pane rounded-lg shadow-2xl"
                                            onMouseLeave={() => setShowProfileMenu(false)}
                                        >
                                            <div className="p-2">
                                                <div className="p-2 mb-2 border-b border-white/10">
                                                    <p className="font-bold text-white">{session.user?.name}</p>
                                                    <p className="text-xs text-zinc-400 truncate">{session.user?.email}</p>
                                                </div>
                                                <Link href="/profile" className="menu-item">
                                                    <User size={16} /> Profile
                                                </Link>
                                                {(session.user as any).role === 'admin' && (
                                                    <Link href="/admin" className="menu-item">
                                                        Admin
                                                    </Link>
                                                )}
                                                <button onClick={() => signOut()} className="menu-item w-full text-red-400">
                                                    <LogOut size={16} /> Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <button onClick={() => setShowAuthModal(true)} className="btn-primary text-sm px-6 py-2">
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </motion.nav>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <RequestMovieModal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} />
            <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
        </>
    );
}

// Helper for menu items
function MenuItem({ children, ...props }: any) {
    return (
        <Link
            href="#"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
            {...props}
        >
            {children}
        </Link>
    );
}
