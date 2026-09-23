'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Shield, Check, Server, Zap, Film, X } from 'react-feather';
import { StreamServer, STREAM_SERVERS } from '@/lib/embed';

interface ServerSelectorProps {
    currentServer: StreamServer;
    onSelectServer: (server: StreamServer) => void;
    antiHijackActive?: boolean;
    onToggleAntiHijack?: () => void;
    className?: string;
}

export default function ServerSelector({
    currentServer,
    onSelectServer,
    antiHijackActive = true,
    onToggleAntiHijack,
    className = '',
}: ServerSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on click outside (desktop)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const activeServerObj = STREAM_SERVERS.find(s => s.id === currentServer) || STREAM_SERVERS[0];

    return (
        <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
            {/* Server Trigger Button */}
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl bg-black/85 hover:bg-black/95 text-white text-xs font-semibold border border-white/20 hover:border-purple-500/50 shadow-lg backdrop-blur-md transition-all active:scale-95 group shrink-0"
                    aria-expanded={isOpen}
                    title="Switch streaming server (Bingr, VidLink, MultiEmbed)"
                >
                    <span className="flex items-center gap-1 text-purple-400 group-hover:text-purple-300">
                        <Server size={13} />
                        <span className="text-zinc-400 font-normal hidden sm:inline">Server:</span>
                    </span>
                    <span className="font-bold text-white flex items-center gap-1">
                        <span>{activeServerObj.icon}</span>
                        <span>{activeServerObj.name}</span>
                    </span>
                    <ChevronDown
                        size={14}
                        className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-purple-400' : ''}`}
                    />
                </button>

                {/* Anti-Hijack Guard Indicator Badge */}
                {antiHijackActive !== undefined && (
                    <button
                        type="button"
                        onClick={onToggleAntiHijack}
                        className={`flex items-center gap-1 px-2 sm:px-2.5 py-2 rounded-xl text-[11px] font-medium border backdrop-blur-md transition-all shadow-md shrink-0 ${
                            antiHijackActive
                                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/70'
                                : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                        }`}
                        title={antiHijackActive ? 'Anti-Hijack Guard is ACTIVE: Rogue ad redirects are blocked' : 'Anti-Hijack Guard is OFF'}
                    >
                        <Shield size={12} className={antiHijackActive ? 'text-emerald-400 fill-emerald-400/20' : 'text-zinc-500'} />
                        <span className="hidden sm:inline">{antiHijackActive ? 'Guard On' : 'Guard Off'}</span>
                    </button>
                )}
            </div>

            {/* Backdrop on mobile screens */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xs sm:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Menu: Mobile Action Sheet (< sm) / Desktop Dropdown (sm+) */}
            {isOpen && (
                <div
                    className="fixed sm:absolute inset-x-3 bottom-4 sm:bottom-auto sm:inset-x-auto sm:left-0 sm:top-full sm:mt-2 sm:w-80 rounded-2xl bg-[#141417]/98 border border-white/20 sm:border-white/15 shadow-2xl backdrop-blur-2xl z-[100] p-3 sm:p-2.5 animate-in fade-in slide-in-from-bottom-3 sm:slide-in-from-top-1 duration-200"
                    style={{
                        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))',
                    }}
                >
                    {/* Mobile Handle */}
                    <div className="w-10 h-1 bg-white/25 rounded-full mx-auto mb-2 sm:hidden" />

                    <div className="px-2 py-1.5 border-b border-white/10 mb-2 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-white sm:text-zinc-400">Stream Servers</p>
                            <p className="text-[11px] text-zinc-400">Switch if video is slow or failing</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                                Fast Switch
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="sm:hidden text-zinc-400 hover:text-white p-1 ml-1"
                                aria-label="Close server sheet"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        {STREAM_SERVERS.map((server) => {
                            const isSelected = server.id === currentServer;
                            return (
                                <button
                                    key={server.id}
                                    type="button"
                                    onClick={() => {
                                        onSelectServer(server.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3.5 py-3 sm:py-2.5 rounded-xl text-left transition-all ${
                                        isSelected
                                            ? 'bg-purple-600/30 border border-purple-500/50 text-white shadow-md'
                                            : 'text-zinc-300 hover:bg-white/5 active:bg-white/10 hover:text-white border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{server.icon}</span>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs sm:text-sm font-bold text-white">{server.name}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-medium">
                                                    {server.badge}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-zinc-400 line-clamp-1">{server.tagline}</p>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white shrink-0 ml-2">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Anti-Hijack Info Footer */}
                    <div className="mt-2.5 pt-2 border-t border-white/10 px-2 py-1 flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1.5">
                            <Shield size={12} className={antiHijackActive ? 'text-emerald-400' : 'text-zinc-500'} />
                            <span>Anti-Hijack Protection</span>
                        </span>
                        {onToggleAntiHijack && (
                            <button
                                type="button"
                                onClick={onToggleAntiHijack}
                                className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${
                                    antiHijackActive
                                        ? 'bg-emerald-500/25 text-emerald-300 hover:bg-emerald-500/35 border border-emerald-500/40'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                }`}
                            >
                                {antiHijackActive ? 'ENABLED' : 'DISABLED'}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
