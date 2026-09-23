'use client';

import { useEffect, useRef, useState } from 'react';
import { Channel } from 'pusher-js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, X, ArrowLeft } from 'react-feather';
import { toast } from 'react-hot-toast';
import { parseEmbedUrl, extractTmdbId, extractBingrTvParams, buildServerUrl, StreamServer, STREAM_SERVERS } from '@/lib/embed';
import ServerSelector from '@/components/ServerSelector';

interface VideoPlayerProps {
    videoUrl: string;
    title: string;
    onClose?: () => void;
    channel?: Channel | null;
    partyId?: string;
    isHost?: boolean;
    tvControls?: React.ReactNode;
    mediaType?: 'movie' | 'tv';
    tmdbId?: string;
    season?: number;
    episode?: number;
    defaultServer?: StreamServer;
    onServerChange?: (server: StreamServer) => void;
}

export default function VideoPlayer({
    videoUrl,
    title,
    onClose,
    channel,
    partyId,
    isHost = false,
    tvControls,
    mediaType,
    tmdbId,
    season,
    episode,
    defaultServer,
    onServerChange,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [buffering, setBuffering] = useState(false);

    // Multi-server & Anti-Hijack state
    const [server, setServer] = useState<StreamServer>(() => {
        if (defaultServer) return defaultServer;
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('ajstreams_stream_server') as StreamServer;
            if (saved === 'bingr' || saved === 'vidlink' || saved === 'multiembed') {
                return saved;
            }
        }
        return 'bingr';
    });

    const [antiHijackActive, setAntiHijackActive] = useState(true);
    const isInternalNavRef = useRef(false);

    const markInternalNavigation = () => {
        isInternalNavRef.current = true;
        setTimeout(() => {
            isInternalNavRef.current = false;
        }, 2000);
    };

    // Detect media parameters for dynamic multi-server URL switching
    const extractedId = tmdbId || extractTmdbId(videoUrl);
    const tvParams = extractBingrTvParams(videoUrl);
    const detectedMediaType: 'movie' | 'tv' = mediaType || (tvControls || season || tvParams.isBingrTv ? 'tv' : 'movie');
    const currentS = season || tvParams.season || 1;
    const currentE = episode || tvParams.episode || 1;

    // Build active URL based on current selected server
    const activeUrl = extractedId
        ? buildServerUrl(server, detectedMediaType, extractedId, currentS, currentE)
        : videoUrl;

    // Parse the input URL/embed snippet
    const embedInfo = parseEmbedUrl(activeUrl);

    // Anti-Hijack Guard: Intercept rogue ad redirects attempting window.top.location hijacking
    useEffect(() => {
        if (!antiHijackActive) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isInternalNavRef.current) return;
            e.preventDefault();
            e.returnValue = 'AJStreams Anti-Hijack Guard blocked an external ad redirect.';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [antiHijackActive]);

    // Anti-Hijack Guard: Protect against unauthorized top-level window.open ad popups
    useEffect(() => {
        if (!antiHijackActive || typeof window === 'undefined') return;

        const originalWindowOpen = window.open;
        window.open = function (...args: any[]) {
            if (!isInternalNavRef.current) {
                console.warn('[Anti-Hijack Guard] Blocked unprompted window.open attempt:', args[0]);
                toast('🛡️ Anti-Hijack blocked an ad popup!', {
                    icon: '🛡️',
                    duration: 2500,
                    style: {
                        background: '#18181c',
                        color: '#fff',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                    },
                });
                return null;
            }
            return originalWindowOpen.apply(this, args as any);
        };

        return () => {
            window.open = originalWindowOpen;
        };
    }, [antiHijackActive]);

    const handleSelectServer = (newServer: StreamServer) => {
        markInternalNavigation();
        setServer(newServer);
        if (typeof window !== 'undefined') {
            localStorage.setItem('ajstreams_stream_server', newServer);
        }
        onServerChange?.(newServer);
        const serverObj = STREAM_SERVERS.find(s => s.id === newServer);
        toast.success(`Switched to ${serverObj?.name || newServer} server`, {
            icon: serverObj?.icon || '🌐',
            duration: 2500,
            style: {
                background: '#18181c',
                color: '#fff',
                border: '1px solid rgba(168, 85, 247, 0.4)',
            },
        });
    };

    const handleBack = () => {
        markInternalNavigation();
        onClose?.();
    };

    const hideControlsTimeout = useRef<NodeJS.Timeout>();

    // Send postMessage command to Bingr / iframe player
    const sendIframeCommand = (command: string, payload: Record<string, any> = {}) => {
        if (!iframeRef.current || !iframeRef.current.contentWindow) return;
        try {
            iframeRef.current.contentWindow.postMessage(
                { command, ...payload },
                '*'
            );
        } catch (err) {
            console.error('Failed to send iframe postMessage command:', err);
        }
    };

    // Listen to Bingr embed postMessage events
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'PLAYER_EVENT' && event.data?.data?.event === 'playerstatus') {
                const { currentTime: cTime, duration: dur, playing } = event.data.data;
                if (typeof cTime === 'number' && !isSyncing) setCurrentTime(cTime);
                if (typeof dur === 'number') setDuration(dur);
                if (typeof playing === 'boolean') setIsPlaying(playing);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isSyncing]);

    // Periodically poll iframe status for Bingr player
    useEffect(() => {
        if (!embedInfo.isIframe) return;
        const interval = setInterval(() => {
            sendIframeCommand('getStatus');
        }, 2000);
        return () => clearInterval(interval);
    }, [embedInfo.isIframe]);

    // Listen to Pusher events for video sync in Watch Party
    useEffect(() => {
        if (!channel || !partyId) return;

        const handleVideoUpdate = (data: any) => {
            if (isHost) return; // Host doesn't sync from others

            console.log('Received video update:', data);
            setIsSyncing(true);

            if (embedInfo.isIframe) {
                if (data.action === 'play') {
                    if (data.currentTime) sendIframeCommand('seek', { time: data.currentTime });
                    sendIframeCommand('play');
                    setIsPlaying(true);
                } else if (data.action === 'pause') {
                    sendIframeCommand('pause');
                    setIsPlaying(false);
                } else if (data.action === 'seek') {
                    sendIframeCommand('seek', { time: data.currentTime });
                    setCurrentTime(data.currentTime);
                }
            } else if (videoRef.current) {
                const timeDiff = Math.abs((videoRef.current.currentTime ?? 0) - (data.currentTime ?? 0));

                if (data.action === 'play') {
                    if (timeDiff > 1) {
                        videoRef.current.currentTime = data.currentTime;
                    }
                    videoRef.current.play().catch(err => console.error('Play error:', err));
                    setIsPlaying(true);
                } else if (data.action === 'pause') {
                    videoRef.current.pause();
                    setIsPlaying(false);
                } else if (data.action === 'seek') {
                    videoRef.current.currentTime = data.currentTime;
                    setCurrentTime(data.currentTime);
                }
            }

            setTimeout(() => setIsSyncing(false), 500);
        };

        channel.bind('video-update', handleVideoUpdate);

        return () => {
            channel.unbind('video-update', handleVideoUpdate);
        };
    }, [channel, partyId, isHost, embedInfo.isIframe]);

    // Request initial sync when joining watch party (for non-hosts)
    useEffect(() => {
        if (!partyId || !channel || isHost) return;

        const requestInitialSync = async () => {
            try {
                const res = await fetch(`/api/watch-party?id=${partyId}`);
                if (res.ok) {
                    const party = await res.json();
                    if (party) {
                        const targetTime = party.currentTime || 0;
                        setCurrentTime(targetTime);

                        if (embedInfo.isIframe) {
                            sendIframeCommand('seek', { time: targetTime });
                            if (party.isPlaying) {
                                sendIframeCommand('play');
                                setIsPlaying(true);
                            }
                        } else if (videoRef.current) {
                            videoRef.current.currentTime = targetTime;
                            if (party.isPlaying) {
                                videoRef.current.play().catch(err => console.error('Initial play error:', err));
                                setIsPlaying(true);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to get initial sync:', error);
            }
        };

        const timeout = setTimeout(requestInitialSync, 1000);
        return () => clearTimeout(timeout);
    }, [partyId, channel, isHost, embedInfo.isIframe]);

    // Periodically update party state in database (host only)
    useEffect(() => {
        if (!partyId || !isHost) return;

        const updatePartyState = async () => {
            try {
                const currentT = embedInfo.isIframe ? currentTime : (videoRef.current?.currentTime || 0);
                await fetch('/api/watch-party', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        partyId,
                        action: 'sync',
                        currentTime: currentT,
                        isPlaying,
                    }),
                });
            } catch (error) {
                console.error('Failed to update party state:', error);
            }
        };

        const interval = setInterval(updatePartyState, 5000);
        return () => clearInterval(interval);
    }, [partyId, isHost, isPlaying, currentTime, embedInfo.isIframe]);

    // Sync video state to other participants (host only)
    const syncVideoState = async (action: string, time?: number) => {
        if (!partyId || !isHost || isSyncing) return;

        const currentT = time ?? (embedInfo.isIframe ? currentTime : (videoRef.current?.currentTime ?? 0));

        try {
            await fetch('/api/pusher/video-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyId,
                    action,
                    currentTime: currentT,
                    isPlaying: action === 'play',
                }),
            });
        } catch (error) {
            toast.error('Sync failed');
        }
    };

    const handlePlayPause = () => {
        if (partyId && !isHost) return;

        if (embedInfo.isIframe) {
            if (isPlaying) {
                sendIframeCommand('pause');
                setIsPlaying(false);
                if (partyId) syncVideoState('pause');
            } else {
                sendIframeCommand('play');
                setIsPlaying(true);
                if (partyId) syncVideoState('play');
            }
            return;
        }

        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
            if (partyId) syncVideoState('pause');
        } else {
            videoRef.current.play().catch(err => console.error('Play error:', err));
            setIsPlaying(true);
            if (partyId) syncVideoState('play');
        }
    };

    const handleSeek = (time: number) => {
        if (partyId && !isHost) return;

        setCurrentTime(time);

        if (embedInfo.isIframe) {
            sendIframeCommand('seek', { time });
            if (partyId) syncVideoState('seek', time);
            return;
        }

        if (!videoRef.current) return;
        videoRef.current.currentTime = time;
        if (partyId) syncVideoState('seek', time);
    };

    const handleSkip = (seconds: number) => {
        if (partyId && !isHost) return;
        const newTime = Math.max(0, Math.min(duration || 3600, currentTime + seconds));
        handleSeek(newTime);
    };

    const handleVolumeChange = (newVolume: number) => {
        setVolume(newVolume);
        setIsMuted(newVolume === 0);

        if (embedInfo.isIframe) {
            sendIframeCommand('volume', { level: newVolume });
            return;
        }

        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
    };

    const toggleMute = () => {
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);

        if (embedInfo.isIframe) {
            sendIframeCommand('mute', { muted: nextMuted });
            return;
        }

        if (videoRef.current) {
            if (nextMuted) {
                videoRef.current.volume = 0;
            } else {
                videoRef.current.volume = volume || 0.5;
            }
        }
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (hideControlsTimeout.current) {
            clearTimeout(hideControlsTimeout.current);
        }
        hideControlsTimeout.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    useEffect(() => {
        return () => {
            if (hideControlsTimeout.current) {
                clearTimeout(hideControlsTimeout.current);
            }
        };
    }, []);

    useEffect(() => {
        // Auto-rotate to landscape on mobile
        const lockOrientation = async () => {
            if (screen.orientation && (screen.orientation as any).lock) {
                try {
                    await (screen.orientation as any).lock('landscape');
                } catch (e) {
                    console.log('Orientation lock not supported or failed', e);
                }
            }
        };

        lockOrientation();

        return () => {
            if (screen.orientation && (screen.orientation as any).unlock) {
                try {
                    (screen.orientation as any).unlock();
                } catch (e) {
                    console.log('Orientation unlock failed', e);
                }
            }
        };
    }, []);

    return (
        /* 100dvh so player fills full viewport on mobile without browser-bar overlap */
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" style={{ height: '100dvh' }}>
            {/* Top Toolbar: Back, Server Selector, TV Controls, Title — all top-left, top-right free for Bingr */}
            <div className="absolute top-2 md:top-4 left-2 md:left-4 z-[60] flex items-center gap-1.5 md:gap-2 flex-wrap max-w-[calc(100vw-80px)] md:max-w-[calc(100vw-130px)] pointer-events-auto">
                {onClose && (
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-semibold border border-white/20 hover:scale-105 transition-all shadow-lg backdrop-blur-md"
                        aria-label="Back"
                    >
                        <ArrowLeft size={16} />
                        <span>Back</span>
                    </button>
                )}

                {/* Multi-Server Selector (Bingr, VidLink, MultiEmbed) */}
                {extractedId && (
                    <ServerSelector
                        currentServer={server}
                        onSelectServer={handleSelectServer}
                        antiHijackActive={antiHijackActive}
                        onToggleAntiHijack={() => {
                            setAntiHijackActive(!antiHijackActive);
                            toast(antiHijackActive ? 'Anti-Hijack Guard paused' : 'Anti-Hijack Guard activated', {
                                icon: '🛡️',
                            });
                        }}
                    />
                )}

                {/* TV Controls (Prev / Next Episode) */}
                {tvControls && (
                    <div className="flex items-center">
                        {tvControls}
                    </div>
                )}

                {/* Title Badge */}
                <h2 className="text-white text-xs font-bold drop-shadow-md truncate max-w-[140px] lg:max-w-xs bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 hidden sm:block">
                    {title}
                </h2>
            </div>

            {/* Video Container */}
            <div
                ref={containerRef}
                className="relative w-full h-full max-w-7xl max-h-screen bg-black group flex items-center justify-center"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && setShowControls(false)}
            >
                {/* Embed / Iframe or Native Video Element */}
                {embedInfo.isIframe ? (
                    <iframe
                        key={embedInfo.embedUrl}
                        ref={iframeRef}
                        src={embedInfo.embedUrl}
                        title={title}
                        className="w-full h-full border-0"
                        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope"
                        allowFullScreen
                        referrerPolicy="origin"
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={embedInfo.embedUrl}
                        className="w-full h-full object-contain"
                        onTimeUpdate={() => !isSyncing && setCurrentTime(videoRef.current?.currentTime ?? 0)}
                        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
                        onWaiting={() => setBuffering(true)}
                        onCanPlay={() => setBuffering(false)}
                        onClick={handlePlayPause}
                    />
                )}

                {/* Buffering Indicator (native video only) */}
                {buffering && !embedInfo.isIframe && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}

                {/* Sync Indicator */}
                {isSyncing && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-brand-purple/90 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium z-40 pointer-events-none">
                        Syncing...
                    </div>
                )}

                {/* Non-Host Message */}
                {partyId && !isHost && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm z-40 pointer-events-none">
                        Host is controlling playback
                    </div>
                )}

                {/* Native Video Controls Overlay (Only for native direct videos, not iframes) */}
                {!embedInfo.isIframe && (
                    <div
                        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 transition-opacity duration-300 pointer-events-none ${
                            showControls ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {/* Bottom Controls Bar */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 pointer-events-auto">
                        {/* Progress Bar (if duration is available) */}
                        {duration > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-white text-sm font-medium min-w-[45px]">
                                    {formatTime(currentTime)}
                                </span>
                                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden group/progress cursor-pointer">
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 100}
                                        value={currentTime}
                                        onChange={(e) => handleSeek(parseFloat(e.target.value))}
                                        disabled={!!(partyId && !isHost)}
                                        className="w-full h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-purple [&::-webkit-slider-thumb]:cursor-pointer disabled:cursor-not-allowed"
                                        style={{
                                            background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
                                        }}
                                    />
                                </div>
                                <span className="text-white text-sm font-medium min-w-[45px]">
                                    {formatTime(duration)}
                                </span>
                            </div>
                        )}

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {/* Play/Pause */}
                                <button
                                    onClick={handlePlayPause}
                                    disabled={!!(partyId && !isHost)}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={isPlaying ? 'Pause' : 'Play'}
                                >
                                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                </button>

                                {/* Skip Backward */}
                                <button
                                    onClick={() => handleSkip(-10)}
                                    disabled={!!(partyId && !isHost)}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Rewind 10s"
                                >
                                    <SkipBack size={18} />
                                </button>

                                {/* Skip Forward */}
                                <button
                                    onClick={() => handleSkip(10)}
                                    disabled={!!(partyId && !isHost)}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Forward 10s"
                                >
                                    <SkipForward size={18} />
                                </button>

                                {/* Volume */}
                                <div className="flex items-center gap-2 group/volume">
                                    <button
                                        onClick={toggleMute}
                                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                                        title={isMuted ? 'Unmute' : 'Mute'}
                                    >
                                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={isMuted ? 0 : volume}
                                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                        className="w-0 group-hover/volume:w-20 transition-all duration-200 h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Right Side Controls */}
                            <div className="flex items-center gap-2">
                                {/* Fullscreen */}
                                <button
                                    onClick={toggleFullscreen}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                >
                                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
    );
}
