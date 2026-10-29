'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Mail, Calendar, Users, Volume2, MessageSquare, Shield, Check, RefreshCw, Radio } from 'react-feather';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { getWatchPartyPreferences, saveWatchPartyPreferences, playMessageChime, WatchPartyPreferences } from '@/lib/watch-party-settings';

export default function ProfilePage() {
    const { data: session } = useSession();
    const [prefs, setPrefs] = useState<WatchPartyPreferences>(getWatchPartyPreferences());
    const [serverStatus, setServerStatus] = useState<{
        enabled: boolean;
        pusherConfigured: boolean;
        mongodbConnected: boolean;
        pusherCluster: string;
    } | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    useEffect(() => {
        setPrefs(getWatchPartyPreferences());
        fetchServerStatus();
    }, []);

    const fetchServerStatus = async () => {
        setIsLoadingStatus(true);
        try {
            const res = await fetch('/api/watch-party/settings');
            if (res.ok) {
                const data = await res.json();
                setServerStatus(data);
            }
        } catch (err) {
            console.error('Failed to check watch party status', err);
        } finally {
            setIsLoadingStatus(false);
        }
    };

    const handleSavePref = <K extends keyof WatchPartyPreferences>(key: K, value: WatchPartyPreferences[K]) => {
        const updated = saveWatchPartyPreferences({ [key]: value });
        setPrefs(updated);
        toast.success('Watch Party settings saved!', { duration: 1800 });
    };

    if (!session) {
        return (
            <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
                <p className="text-zinc-400">Please sign in to view your profile and settings.</p>
            </div>
        );
    }

    return (
        <div className="library-page">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto space-y-8"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Profile & Settings</h1>
                    <p className="text-zinc-400">Manage your account details and personalize your Watch Party experience.</p>
                </div>

                {/* Profile Card */}
                <div className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="h-28 bg-gradient-brand relative">
                        <div className="absolute -bottom-10 left-8">
                            <div className="w-20 h-20 rounded-full bg-zinc-900 p-1">
                                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                                    {session.user?.name?.[0] || 'U'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-14 p-6 sm:p-8 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                                    <User size={14} /> Full Name
                                </label>
                                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-medium">
                                    {session.user?.name || 'Anonymous'}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                                    <Mail size={14} /> Email Address
                                </label>
                                <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm font-medium truncate">
                                    {session.user?.email}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Watch Party Settings Section */}
                <div className="bg-zinc-900 rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
                                <Users size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Watch Party Settings</h2>
                                <p className="text-xs text-zinc-400">Configure how you watch, chat, and sync with friends</p>
                            </div>
                        </div>

                        {/* Server Status Pill */}
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 text-xs shrink-0 self-start sm:self-auto">
                            <span className={`w-2 h-2 rounded-full ${serverStatus?.pusherConfigured ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                            <span className="text-zinc-300">
                                {isLoadingStatus
                                    ? 'Checking service...'
                                    : serverStatus?.pusherConfigured
                                        ? 'Pusher Sync Active'
                                        : 'Local Mode (Pusher optional)'}
                            </span>
                            <button
                                onClick={fetchServerStatus}
                                title="Refresh service status"
                                className="text-zinc-500 hover:text-white transition-colors ml-1"
                            >
                                <RefreshCw size={12} className={isLoadingStatus ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {/* Custom Nickname */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-white flex items-center gap-2">
                                <User size={16} className="text-brand-accent" />
                                Party Display Nickname
                            </label>
                            <p className="text-xs text-zinc-400">The name your friends see in live chat and participant lists.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={session.user?.name || 'Enter custom display name'}
                                    value={prefs.nickname}
                                    onChange={(e) => setPrefs(p => ({ ...p, nickname: e.target.value }))}
                                    onBlur={(e) => handleSavePref('nickname', e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-accent/50"
                                />
                                <button
                                    onClick={() => handleSavePref('nickname', prefs.nickname)}
                                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all"
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* Default Privacy Preference */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5">
                            <div className="space-y-0.5">
                                <div className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Shield size={16} className="text-brand-accent" />
                                    Default Party Privacy
                                </div>
                                <p className="text-xs text-zinc-400">
                                    {prefs.defaultPrivacy === 'public'
                                        ? 'Public — Listed on the Watch Parties page for anyone with the link to join.'
                                        : 'Private — Hidden from listings and requires a password to enter.'}
                                </p>
                            </div>
                            <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                                <button
                                    onClick={() => handleSavePref('defaultPrivacy', 'public')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${prefs.defaultPrivacy === 'public' ? 'bg-brand-accent text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Public
                                </button>
                                <button
                                    onClick={() => handleSavePref('defaultPrivacy', 'private')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${prefs.defaultPrivacy === 'private' ? 'bg-brand-accent text-white shadow' : 'text-zinc-400 hover:text-white'}`}
                                >
                                    Private
                                </button>
                            </div>
                        </div>

                        {/* Auto-open Chat */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5">
                            <div className="space-y-0.5">
                                <div className="text-sm font-semibold text-white flex items-center gap-2">
                                    <MessageSquare size={16} className="text-brand-accent" />
                                    Auto-Open Live Chat
                                </div>
                                <p className="text-xs text-zinc-400">Automatically expand the chat drawer whenever you enter a watch party.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={prefs.autoOpenChat}
                                onChange={(e) => handleSavePref('autoOpenChat', e.target.checked)}
                                className="w-5 h-5 rounded cursor-pointer accent-brand-accent"
                            />
                        </div>

                        {/* Chat Notification Sound */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5">
                            <div className="space-y-0.5">
                                <div className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Volume2 size={16} className="text-brand-accent" />
                                    Message Sound Chime
                                </div>
                                <p className="text-xs text-zinc-400">Play a pleasant notification tone when friends send a message.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={playMessageChime}
                                    className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Listen to notification chime"
                                >
                                    Test sound
                                </button>
                                <input
                                    type="checkbox"
                                    checked={prefs.soundNotifications}
                                    onChange={(e) => handleSavePref('soundNotifications', e.target.checked)}
                                    className="w-5 h-5 rounded cursor-pointer accent-brand-accent"
                                />
                            </div>
                        </div>

                        {/* Playback Auto-Sync */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/5">
                            <div className="space-y-0.5">
                                <div className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Radio size={16} className="text-brand-accent" />
                                    Lockstep Host Playback Sync
                                </div>
                                <p className="text-xs text-zinc-400">Automatically sync your play, pause, and seek commands with the party host.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={prefs.autoSync}
                                onChange={(e) => handleSavePref('autoSync', e.target.checked)}
                                className="w-5 h-5 rounded cursor-pointer accent-brand-accent"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
