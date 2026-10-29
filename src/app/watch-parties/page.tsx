'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, Lock, Unlock, Play, Search, Key, Plus, X, ArrowRight, Shield } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
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
    const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [enterCode, setEnterCode] = useState('');

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
            router.push('/account');
        } else if (status === 'authenticated') {
            fetchParties();
        }
    }, [status, router]);

    const handleJoinByCode = (e: React.FormEvent) => {
        e.preventDefault();
        const code = enterCode.trim().toUpperCase();
        if (!code) {
            toast.error('Please enter a valid party code');
            return;
        }
        router.push(`/watch-party/${code}`);
    };

    const filteredParties = Array.isArray(parties) ? parties.filter(party => {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
            (party.partyName || '').toLowerCase().includes(query) ||
            (party.movieTitle || '').toLowerCase().includes(query) ||
            (party.shareCode || '').toLowerCase().includes(query);

        if (!matchesQuery) return false;
        if (filter === 'public') return !party.isPrivate;
        if (filter === 'private') return party.isPrivate;
        return true;
    }) : [];

    if (status === 'loading' || isLoading) {
        return (
            <div className="library-page max-w-7xl mx-auto">
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
        <div className="library-page max-w-7xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">Watch Parties</h1>
                    <p className="text-zinc-400">Stream synchronized movies and shows in real-time with your friends.</p>
                </div>

                {/* Action Buttons: Join by Code & Start Party */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="btn-secondary flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-xl"
                    >
                        <Key size={16} />
                        Join with Code
                    </button>
                    <button
                        onClick={() => router.push('/movies')}
                        className="btn-primary flex items-center justify-center gap-2 py-2.5 px-5 text-sm font-semibold rounded-xl shadow-glow"
                    >
                        <Plus size={16} />
                        Start New Party
                    </button>
                </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex gap-2 w-full sm:w-auto">
                    {(['all', 'public', 'private'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                                filter === tab
                                    ? 'bg-brand-accent text-white shadow'
                                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {tab === 'all' ? `All (${parties.length})` : tab}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search parties, titles, or codes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-brand-accent/50 transition-all"
                    />
                </div>
            </div>

            {/* Parties Grid or Empty State */}
            {filteredParties.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-white/5 p-8 max-w-2xl mx-auto space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-zinc-500">
                        <Users size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white">No Active Watch Parties</h3>
                    <p className="text-zinc-400 text-sm max-w-md mx-auto">
                        There are currently no parties matching your filter. Start one yourself or enter a code from a friend!
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                            onClick={() => setShowJoinModal(true)}
                            className="btn-secondary text-xs px-4 py-2.5 rounded-xl flex items-center gap-2"
                        >
                            <Key size={14} /> Enter Party Code
                        </button>
                        <button
                            onClick={() => router.push('/movies')}
                            className="btn-primary text-xs px-4 py-2.5 rounded-xl flex items-center gap-2"
                        >
                            Explore Titles to Watch <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredParties.map((party) => (
                        <motion.div
                            key={party._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-brand-accent/50 transition-all group flex flex-col justify-between"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                            party.isPrivate
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-green-500/20 text-green-400'
                                        }`}>
                                            {party.isPrivate ? <Lock size={12} /> : <Unlock size={12} />}
                                            {party.isPrivate ? 'Private' : 'Public'}
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-white/5 text-zinc-400 text-xs font-bold flex items-center gap-1">
                                            <Users size={12} />
                                            {party.participants?.length || 1}
                                        </span>
                                    </div>
                                    <span className="font-mono text-xs font-bold px-2 py-1 bg-white/5 rounded-lg text-brand-accent border border-white/5">
                                        #{party.shareCode}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1 truncate">{party.partyName || 'Untitled Party'}</h3>
                                <p className="text-brand-accent text-sm font-medium mb-4 truncate">
                                    Watching: <span className="text-white">{party.movieTitle || 'Unknown Movie'}</span>
                                </p>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-white shadow-md">
                                        {party.host?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-zinc-500 text-xs">Hosted by</p>
                                        <p className="text-white font-medium">{party.host?.name || 'Unknown'}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push(`/watch-party/${party.shareCode}`)}
                                    className="w-full bg-white/5 hover:bg-brand-accent text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-brand-accent"
                                >
                                    <Play size={18} fill="currentColor" />
                                    Join Party
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Join with Code Modal */}
            <AnimatePresence>
                {showJoinModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowJoinModal(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative modal-bg max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl z-10 border border-white/10"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
                                        <Key size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Join Watch Party</h3>
                                        <p className="text-xs text-zinc-400">Enter the 8-character share code</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowJoinModal(false)}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleJoinByCode} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                        Party Share Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 9B2E4A7F"
                                        value={enterCode}
                                        onChange={(e) => setEnterCode(e.target.value.toUpperCase())}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-center text-2xl font-mono tracking-widest text-white uppercase focus:outline-none focus:border-brand-accent/60 placeholder:text-zinc-600"
                                        maxLength={12}
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowJoinModal(false)}
                                        className="btn-ghost flex-1 py-3"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                                    >
                                        <Play size={16} fill="currentColor" />
                                        Enter Party
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
