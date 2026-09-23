'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Bookmark, Users, Search } from 'react-feather';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import SearchModal from './SearchModal';

const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/movies', label: 'Movies', icon: Film },
    { href: '/my-list', label: 'My List', icon: Bookmark, requireAuth: true },
    { href: '/watch-parties', label: 'Parties', icon: Users, requireAuth: true },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [showSearch, setShowSearch] = useState(false);

    // Hide bottom nav on player/watch pages (they need full screen)
    const isPlayerPage =
        pathname?.startsWith('/watch/') ||
        pathname?.startsWith('/movie/') ||
        pathname === null;

    if (isPlayerPage) return null;

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname?.startsWith(href);
    };

    return (
        <>
            {/* Bottom Navigation Bar - Mobile only */}
            <nav className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
                {/* Safe area padding for iOS home bar */}
                <div className="bg-zinc-950/95 backdrop-blur-xl border-t border-white/10 shadow-2xl">
                    <div className="flex items-center justify-around px-2 pt-2 pb-safe-bottom" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
                        {/* Search */}
                        <button
                            onClick={() => setShowSearch(true)}
                            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all text-zinc-500 hover:text-white"
                            aria-label="Search"
                        >
                            <Search size={22} />
                            <span className="text-[10px] font-medium">Search</span>
                        </button>

                        {navItems.map((item) => {
                            if (item.requireAuth && !session) return null;
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                                        active
                                            ? 'text-purple-400'
                                            : 'text-zinc-500 hover:text-white'
                                    }`}
                                    aria-label={item.label}
                                >
                                    <div className="relative">
                                        <Icon size={22} fill={active ? 'currentColor' : 'none'} />
                                        {active && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-medium ${active ? 'text-purple-400' : ''}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}

                        {/* Profile or Sign In */}
                        {session ? (
                            <Link
                                href="/profile"
                                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-zinc-500 hover:text-white transition-all"
                            >
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                                    {session.user?.name?.[0] || 'U'}
                                </div>
                                <span className="text-[10px] font-medium">Profile</span>
                            </Link>
                        ) : (
                            <Link
                                href="/"
                                onClick={() => {}}
                                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-zinc-500 hover:text-white transition-all"
                            >
                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                                    <Users size={14} />
                                </div>
                                <span className="text-[10px] font-medium">Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
        </>
    );
}
