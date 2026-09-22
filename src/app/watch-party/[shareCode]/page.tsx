'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Lock, Play, Loader } from 'react-feather';

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
    participants: string[];
    isActive: boolean;
    currentTime: number;
    isPlaying: boolean;
}

export default function WatchPartyPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const shareCode = params.shareCode as string;

    const [party, setParty] = useState<WatchParty | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

    useEffect(() => {
        if (shareCode) {
            fetchParty();
        }
    }, [shareCode, session]); // Re-fetch when session loads to check participation

    useEffect(() => {
        if (party && session?.user && status === 'authenticated') {
            if (party.isPrivate && !party.participants.includes(session.user.id)) {
                setShowPasswordPrompt(true);
            }
        }
    }, [party, session, status]);

    const fetchParty = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/watch-party?code=${shareCode}`);

            if (res.ok) {
                const data = await res.json();
                setParty(data);
            } else {
                setError('Watch party not found or has ended');
            }
        } catch (error) {
            console.error('Failed to fetch party:', error);
            setError('Failed to load watch party');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinParty = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (status === 'loading') return;

        if (!session) {
            // Save current URL to redirect back after login if needed
            // For now, just redirect to login
            router.push('/?login=true');
            return;
        }

        if (!party) return;

        try {
            const res = await fetch('/api/watch-party', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyId: party._id,
                    action: 'join',
                    password: party.isPrivate ? password : undefined
                }),
            });

            if (res.ok) {
                // Redirect to movie page or video player
                router.push(`/movie/${party.movieId}?party=${party._id}`);
            } else {
                const data = await res.json();
                if (data.error === 'Incorrect password') {
                    setShowPasswordPrompt(true);
                }
                setError(data.error || 'Failed to join party');
            }
        } catch (error) {
            console.error('Failed to join party:', error);
            setError('Failed to join party');
        }
    };

    if (isLoading || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader className="animate-spin text-brand-purple mx-auto mb-4" size={48} />
                    <p className="text-white text-lg">Loading watch party...</p>
                </div>
            </div>
        );
    }

    if (showPasswordPrompt) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="modal-bg p-8 max-w-md w-full">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-4">
                            <Lock size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Private Watch Party</h1>
                        <p className="text-zinc-400">"{party?.partyName}" is password protected</p>
                    </div>

                    <form onSubmit={handleJoinParty} className="space-y-4">
                        <div className="card p-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Movie</span>
                                <span className="text-white">{party?.movieTitle}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Host</span>
                                <span className="text-white">{party?.host.name}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-400">Viewers</span>
                                <span className="text-white">{party?.participants.length}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-400">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-purple/50"
                                required
                                autoFocus
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm">{error}</p>
                        )}

                        <button
                            type="submit"
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <Play size={16} fill="currentColor" />
                            {session ? 'Join Party' : 'Login to Join'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (error || !party) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="modal-bg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Party Not Found</h1>
                    <p className="text-zinc-400 mb-6">{error || 'This watch party may have ended or the link is invalid.'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="btn-primary w-full"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="modal-bg p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Join Watch Party</h1>
                    <p className="text-zinc-400">You're invited to watch together!</p>
                </div>

                <div className="space-y-4">
                    <div className="card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Party Name</span>
                            <span className="text-white font-bold">{party.partyName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Movie</span>
                            <span className="text-white">{party.movieTitle}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Host</span>
                            <span className="text-white">{party.host.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Viewers</span>
                            <span className="text-white">{party.participants.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Status</span>
                            <span className={`text-sm font-medium ${party.isPlaying ? 'text-green-500' : 'text-yellow-500'}`}>
                                {party.isPlaying ? 'Playing' : 'Paused'}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    )}

                    <button
                        onClick={() => handleJoinParty()}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <Play size={16} fill="currentColor" />
                        {session ? 'Join & Start Watching' : 'Login to Join'}
                    </button>
                </div>
            </div>
        </div>
    );
}
