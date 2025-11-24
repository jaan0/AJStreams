'use client';

import { useSession } from 'next-auth/react';
import { User, Mail, Calendar } from 'react-feather';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const { data: session } = useSession();

    if (!session) {
        return (
            <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
                <p className="text-zinc-400">Please sign in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-4 md:px-12 pb-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto"
            >
                <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

                <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-purple-600 to-pink-600 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 rounded-full bg-zinc-900 p-1">
                                <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-white">
                                    {session.user?.name?.[0] || 'U'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 p-8 space-y-6">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <User size={16} />
                                    Full Name
                                </label>
                                <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-white">
                                    {session.user?.name}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Mail size={16} />
                                    Email Address
                                </label>
                                <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-white">
                                    {session.user?.email}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Calendar size={16} />
                                    Account Type
                                </label>
                                <div className="p-3 rounded-lg bg-black/50 border border-white/10 text-white capitalize">
                                    {(session.user as any).role || 'User'}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">Account Settings</h3>
                            <p className="text-sm text-zinc-500">
                                Password change and other settings coming soon.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
