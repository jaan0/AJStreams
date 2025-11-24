'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Play, Copy, Check, Lock, Share2 } from 'react-feather';
import { createPortal } from 'react-dom';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

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
    createdAt: string;
}

interface WatchPartyModalProps {
    isOpen: boolean;
    onClose: () => void;
    movieId: string;
    movieTitle: string;
    onJoinParty: (partyId: string) => void;
}

export default function WatchPartyModal({
    isOpen,
    onClose,
    movieId,
    movieTitle,
    onJoinParty
}: WatchPartyModalProps) {
    const { data: session } = useSession();
    const [activeParties, setActiveParties] = useState<WatchParty[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createdParty, setCreatedParty] = useState<WatchParty | null>(null);

    // Form state
    const [partyName, setPartyName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [password, setPassword] = useState('');
    const [joinPassword, setJoinPassword] = useState('');
    const [selectedParty, setSelectedParty] = useState<WatchParty | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchActiveParties();
            setShowCreateForm(false);
            setCreatedParty(null);
        }
    }, [isOpen]);

    const fetchActiveParties = async () => {
        try {
            const res = await fetch('/api/watch-party');
            if (res.ok) {
                const data = await res.json();
                const movieParties = data.filter((p: WatchParty) => p.movieId === movieId);
                setActiveParties(movieParties);
            }
        } catch (error) {
            console.error('Failed to fetch watch parties', error);
        }
    };

    const handleCreateParty = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session) {
            toast.error('Please login to create a watch party');
            return;
        }

        if (!partyName.trim()) {
            toast.error('Please enter a party name');
            return;
        }

        if (isPrivate && !password.trim()) {
            toast.error('Please set a password for private party');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/watch-party', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    movieId,
                    movieTitle,
                    partyName,
                    isPrivate,
                    password: isPrivate ? password : undefined
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setCreatedParty(data);
                setShowCreateForm(false);
                setPartyName('');
                setPassword('');
                setIsPrivate(false);
                toast.success('Watch party created!');
            } else {
                toast.error(data.error || data.details || 'Failed to create watch party');
            }
        } catch (error) {
            console.error('Network error:', error);
            toast.error('Failed to create watch party');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinCreatedParty = () => {
        if (createdParty) {
            onJoinParty(createdParty._id);
            onClose();
        }
    };

    const handleJoinParty = async (party: WatchParty) => {
        if (!session) {
            toast.error('Please login to join a watch party');
            return;
        }

        if (party.isPrivate) {
            setSelectedParty(party);
            return;
        }

        await joinParty(party._id);
    };

    const joinParty = async (partyId: string, pwd?: string) => {
        try {
            const res = await fetch('/api/watch-party', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyId,
                    action: 'join',
                    password: pwd
                }),
            });

            if (res.ok) {
                onJoinParty(partyId);
                onClose();
                toast.success('Joined watch party!');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to join party');
            }
        } catch (error) {
            console.error('Failed to join watch party', error);
            toast.error('Failed to join watch party');
        }
    };

    const handleJoinPrivateParty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedParty) {
            await joinParty(selectedParty._id, joinPassword);
            setSelectedParty(null);
            setJoinPassword('');
        }
    };

    const copyShareLink = (shareCode: string) => {
        const link = `${window.location.origin}/watch-party/${shareCode}`;
        navigator.clipboard.writeText(link);
        setCopiedCode(shareCode);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                    />

                    {/* Success Modal */}
                    {createdParty ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                        >
                            <div className="modal-bg shadow-2xl w-full max-w-md p-8">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 rounded-full bg-gradient-brand flex items-center justify-center mx-auto mb-4">
                                        <Check size={32} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Party Created!</h2>
                                    <p className="text-zinc-400">Share this link with your friends to watch together</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Party Info */}
                                    <div className="card p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Party Name</span>
                                            <span className="text-white font-bold">{createdParty.partyName}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Movie</span>
                                            <span className="text-white">{createdParty.movieTitle}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400">Share Code</span>
                                            <span className="text-brand-purple font-mono font-bold">{createdParty.shareCode}</span>
                                        </div>
                                        {createdParty.isPrivate && (
                                            <div className="flex items-center gap-2 text-yellow-500 text-sm">
                                                <Lock size={14} />
                                                <span>Private Party</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Share Link */}
                                    <div className="space-y-2">
                                        <label className="text-sm text-zinc-400">Share Link</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={`${window.location.origin}/watch-party/${createdParty.shareCode}`}
                                                readOnly
                                                className="flex-1 bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white text-sm"
                                            />
                                            <button
                                                onClick={() => copyShareLink(createdParty.shareCode)}
                                                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                            >
                                                {copiedCode === createdParty.shareCode ? (
                                                    <Check size={18} className="text-green-500" />
                                                ) : (
                                                    <Copy size={18} className="text-white" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => {
                                                setCreatedParty(null);
                                                onClose();
                                            }}
                                            className="btn-ghost flex-1"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={handleJoinCreatedParty}
                                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                                        >
                                            <Play size={16} fill="currentColor" />
                                            Start Watching
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* Main Modal */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                        >
                            <div className="modal-bg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
                                {/* Header */}
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center">
                                            <Users size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Watch Party</h2>
                                            <p className="text-sm text-zinc-400">{movieTitle}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-6 max-h-[calc(85vh-100px)] overflow-y-auto">
                                    {!showCreateForm ? (
                                        <>
                                            <button
                                                onClick={() => setShowCreateForm(true)}
                                                className="btn-primary w-full flex items-center justify-center gap-2"
                                            >
                                                <Play size={20} fill="currentColor" />
                                                Create Watch Party
                                            </button>

                                            {activeParties.length > 0 && (
                                                <div className="space-y-3">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                                                        Active Parties ({activeParties.length})
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {activeParties.map((party) => (
                                                            <div
                                                                key={party._id}
                                                                className="card hover:bg-white/10 p-4 transition-colors"
                                                            >
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p className="text-white font-bold">{party.partyName}</p>
                                                                            {party.isPrivate && (
                                                                                <Lock size={14} className="text-yellow-500" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm text-zinc-400">
                                                                            Host: {party.host.name} • {party.participants.length} viewers
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => copyShareLink(party.shareCode)}
                                                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                                                        >
                                                                            {copiedCode === party.shareCode ? (
                                                                                <Check size={18} className="text-green-500" />
                                                                            ) : (
                                                                                <Copy size={18} />
                                                                            )}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleJoinParty(party)}
                                                                            className="px-4 py-2 bg-brand-purple hover:bg-brand-purple/80 text-white rounded-lg font-medium transition-colors"
                                                                        >
                                                                            Join
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                                    <span className={`w-2 h-2 rounded-full ${party.isPlaying ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                                    {party.isPlaying ? 'Playing' : 'Paused'}
                                                                    <span className="mx-2">•</span>
                                                                    <span>Code: {party.shareCode}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {activeParties.length === 0 && (
                                                <div className="text-center py-8 text-zinc-500">
                                                    <Users size={48} className="mx-auto mb-3 opacity-50" />
                                                    <p>No active watch parties for this movie</p>
                                                    <p className="text-sm mt-1">Create one to watch with friends!</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <form onSubmit={handleCreateParty} className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-zinc-400">Party Name</label>
                                                <input
                                                    type="text"
                                                    value={partyName}
                                                    onChange={(e) => setPartyName(e.target.value)}
                                                    placeholder="e.g., Movie Night with Friends"
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-purple/50"
                                                    required
                                                />
                                            </div>

                                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                                <input
                                                    type="checkbox"
                                                    id="isPrivate"
                                                    checked={isPrivate}
                                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                                    className="w-5 h-5 rounded"
                                                />
                                                <label htmlFor="isPrivate" className="text-white font-medium cursor-pointer select-none flex items-center gap-2">
                                                    <Lock size={16} />
                                                    Make this party private
                                                </label>
                                            </div>

                                            {isPrivate && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-zinc-400">Password</label>
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Set a password"
                                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-purple/50"
                                                        required={isPrivate}
                                                    />
                                                </div>
                                            )}

                                            <div className="flex gap-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCreateForm(false)}
                                                    className="btn-ghost flex-1"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isLoading}
                                                    className="btn-primary flex-1"
                                                >
                                                    {isLoading ? 'Creating...' : 'Create Party'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Password Prompt */}
                    {selectedParty && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="fixed inset-0 z-[102] flex items-center justify-center p-4"
                        >
                            <div className="modal-bg p-6 w-full max-w-md">
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Lock size={20} className="text-yellow-500" />
                                    Private Party
                                </h3>
                                <p className="text-zinc-400 mb-4">
                                    "{selectedParty.partyName}" is password protected
                                </p>
                                <form onSubmit={handleJoinPrivateParty} className="space-y-4">
                                    <input
                                        type="password"
                                        value={joinPassword}
                                        onChange={(e) => setJoinPassword(e.target.value)}
                                        placeholder="Enter password"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-purple/50"
                                        required
                                        autoFocus
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedParty(null);
                                                setJoinPassword('');
                                            }}
                                            className="btn-ghost flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-primary flex-1"
                                        >
                                            Join
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
