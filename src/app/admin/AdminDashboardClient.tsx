'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Film, Inbox } from 'react-feather';
import { cn } from '@/lib/utils';
import MoviesTab from '../../components/admin/MoviesTab';
import RequestsTab from '../../components/admin/RequestsTab';

export default function AdminDashboardClient() {
    const [activeTab, setActiveTab] = useState<'movies' | 'requests'>('movies');

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 mb-8">
                <button
                    onClick={() => setActiveTab('movies')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                        activeTab === 'movies'
                            ? 'text-white'
                            : 'text-zinc-400 hover:text-white'
                    )}
                >
                    <Film size={18} />
                    Movies
                    {activeTab === 'movies' && (
                        <motion.div
                            layoutId="activeAdminTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                        />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                        activeTab === 'requests'
                            ? 'text-white'
                            : 'text-zinc-400 hover:text-white'
                    )}
                >
                    <Inbox size={18} />
                    Requests
                    {activeTab === 'requests' && (
                        <motion.div
                            layoutId="activeAdminTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                        />
                    )}
                </button>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'movies' ? <MoviesTab /> : <RequestsTab />}
            </div>
        </div>
    );
}
