'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Layers, Film } from 'react-feather';

interface TvNavigationControlsProps {
    currentSeason: number;
    currentEpisode: number;
    episodeTitle?: string;
    onPrevEpisode?: () => void;
    onNextEpisode?: () => void;
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
    hasPrev?: boolean;
    hasNext?: boolean;
}

export default function TvNavigationControls({
    currentSeason,
    currentEpisode,
    episodeTitle,
    onPrevEpisode,
    onNextEpisode,
    onToggleSidebar,
    isSidebarOpen,
    hasPrev = true,
    hasNext = true,
}: TvNavigationControlsProps) {
    return (
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-xl text-white">
            {/* Prev Episode button */}
            <button
                type="button"
                onClick={onPrevEpisode}
                disabled={!hasPrev || currentEpisode <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Episode"
            >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Current Episode badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-xl">
                <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold tracking-wider uppercase border border-purple-500/30">
                    S{currentSeason} : E{currentEpisode}
                </span>
                {episodeTitle && (
                    <span className="text-xs font-medium text-zinc-300 truncate max-w-[140px] sm:max-w-[200px] hidden md:inline">
                        {episodeTitle}
                    </span>
                )}
            </div>

            {/* Next Episode button */}
            <button
                type="button"
                onClick={onNextEpisode}
                disabled={!hasNext}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Episode"
            >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} />
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-white/10 mx-0.5" />

            {/* Episodes Drawer Toggle Button */}
            <button
                type="button"
                onClick={onToggleSidebar}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSidebarOpen
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                }`}
                title="View all episodes"
            >
                <Layers size={14} />
                <span>Episodes</span>
            </button>
        </div>
    );
}
