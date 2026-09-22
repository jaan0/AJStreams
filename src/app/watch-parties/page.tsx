'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, Lock, Unlock, Play, Search, Loader } from 'react-feather';
import { motion } from 'framer-motion';
import WatchPartyCardSkeleton from '@/components/skeletons/WatchPartyCardSkeleton';

interface WatchParty {
    _id: string;
    host: {
        _id: string;
        name: string;
        email: string;
    };
    movieId: string;
    movieTitle: string;
    partyName: string;
    isPrivate: boolean;
    shareCode: string;
    participants: any[];
    isActive: boolean;
}

export default function WatchPartiesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [parties, setParties] = useState<WatchParty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchParties = async () => {
        try {
            const res = await fetch('/api/watch-party');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setParties(data);
                } else {
                    console.error('API returned non-array:', data);
                    setParties([]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch parties:', error);
            setParties([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/?login=true');
        } else if (status === 'authenticated') {
            fetchParties();
        }
    }, [status, router]);

    const filteredParties = Array.isArray(parties) ? parties.filter(party =>
        (party.partyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (party.movieTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse" />
                    </div>
                    <div className="w-full md:w-96 h-12 bg-zinc-800 rounded-xl animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <WatchPartyCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null;
    }

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Live Watch Parties</h1>
                    <p className="text-zinc-400">Join others and watch movies together in real-time.</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search parties or movies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple/50 transition-all"
                    />
                </div>
            </div>

            {filteredParties.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-white/5">
                    <Users size={48} className="mx-auto text-zinc-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Active Parties</h3>
                    <p className="text-zinc-400">Be the first to start a watch party from any movie page!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredParties.map((party) => (
                        <motion.div
                            key={party._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-brand-purple/50 transition-all group"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${party.isPrivate
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-green-500/20 text-green-400'
                                            }`}>
                                            {party.isPrivate ? <Lock size={12} /> : <Unlock size={12} />}
                                            {party.isPrivate ? 'Private' : 'Public'}
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-white/5 text-zinc-400 text-xs font-bold flex items-center gap-1">
                                            <Users size={12} />
                                            {party.participants?.length || 0}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1 truncate">{party.partyName || 'Untitled Party'}</h3>
                                <p className="text-brand-purple text-sm font-medium mb-4 truncate">
                                    Watching: <span className="text-white">{party.movieTitle || 'Unknown Movie'}</span>
                                </p>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-xs font-bold text-white">
                                        {party.host?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-zinc-400 text-xs">Hosted by</p>
                                        <p className="text-white font-medium">{party.host?.name || 'Unknown'}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push(`/watch-party/${party.shareCode}`)}
                                    className="w-full bg-white/5 hover:bg-brand-purple text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-brand-purple"
                                >
                                    <Play size={18} fill="currentColor" />
                                    Join Party
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
