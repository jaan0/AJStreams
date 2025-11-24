'use client';

import { useEffect, useRef, useState } from 'react';
import { Channel } from 'pusher-js';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, X } from 'react-feather';
import { toast } from 'react-hot-toast';

interface VideoPlayerProps {
    videoUrl: string;
    title: string;
    onClose: () => void;
    channel?: Channel | null;
    partyId?: string;
    isHost?: boolean;
}

export default function VideoPlayer({
    videoUrl,
    title,
    onClose,
    channel,
    partyId,
    isHost = false,
}: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
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
    const hideControlsTimeout = useRef<NodeJS.Timeout>();

    // Listen to Pusher events for video sync
    useEffect(() => {
        if (!channel || !partyId) return;

        const handleVideoUpdate = (data: any) => {
            if (!videoRef.current || isHost) return; // Host doesn't sync from others

            console.log('Received video update:', data);
            setIsSyncing(true);

            const timeDiff = Math.abs((videoRef.current.currentTime ?? 0) - (data.currentTime ?? 0));

            if (data.action === 'play') {
                // Sync time if difference is more than 1 second
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

            setTimeout(() => setIsSyncing(false), 500);
        };

        channel.bind('video-update', handleVideoUpdate);

        return () => {
            channel.unbind('video-update', handleVideoUpdate);
        };
    }, [channel, partyId, isHost]);

    // Request initial sync when joining (for non-hosts)
    useEffect(() => {
        if (!partyId || !channel || isHost || !videoRef.current) return;

        const requestInitialSync = async () => {
            try {
                const res = await fetch(`/api/watch-party?id=${partyId}`);
                if (res.ok) {
                    const party = await res.json();
                    if (party && videoRef.current) {
                        videoRef.current.currentTime = party.currentTime || 0;
                        setCurrentTime(party.currentTime || 0);

                        if (party.isPlaying) {
                            videoRef.current.play().catch(err => console.error('Initial play error:', err));
                            setIsPlaying(true);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to get initial sync:', error);
            }
        };

        const timeout = setTimeout(requestInitialSync, 1000);
        return () => clearTimeout(timeout);
    }, [partyId, channel, isHost]);

    // Periodically update party state in database (host only)
    useEffect(() => {
        if (!partyId || !isHost || !videoRef.current) return;

        const updatePartyState = async () => {
            try {
                await fetch('/api/watch-party', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        partyId,
                        action: 'sync',
                        currentTime: videoRef.current?.currentTime || 0,
                        isPlaying,
                    }),
                });
            } catch (error) {
                // Silent error for background sync
                console.error('Failed to update party state:', error);
            }
        };

        const interval = setInterval(updatePartyState, 5000);
        return () => clearInterval(interval);
    }, [partyId, isHost, isPlaying]);

    // Sync video state to other participants (host only)
    const syncVideoState = async (action: string, time?: number) => {
        if (!partyId || !isHost || isSyncing) return;

        try {
            await fetch('/api/pusher/video-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyId,
                    action,
                    currentTime: time ?? videoRef.current?.currentTime ?? 0,
                    isPlaying: action === 'play',
                }),
            });
        } catch (error) {
            toast.error('Sync failed');
        }
    };

    const handlePlayPause = () => {
        if (!videoRef.current) return;
        if (partyId && !isHost) return;

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
        if (!videoRef.current) return;
        if (partyId && !isHost) return;

        videoRef.current.currentTime = time;
        setCurrentTime(time);
        if (partyId) syncVideoState('seek', time);
    };

    const handleSkip = (seconds: number) => {
        if (!videoRef.current) return;
        if (partyId && !isHost) return;

        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        handleSeek(newTime);
    };

    const handleVolumeChange = (newVolume: number) => {
        if (!videoRef.current) return;
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (!videoRef.current) return;
        if (isMuted) {
            videoRef.current.volume = volume || 0.5;
            setIsMuted(false);
        } else {
            videoRef.current.volume = 0;
            setIsMuted(true);
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

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[60] w-12 h-12 rounded-full bg-black/80 hover:bg-black flex items-center justify-center text-white transition-colors"
                aria-label="Close video player"
            >
                <X size={24} />
            </button>

            {/* Video Container */}
            <div
                ref={containerRef}
                className="relative w-full h-full max-w-7xl max-h-screen bg-black group"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && setShowControls(false)}
            >
                {/* Video Element */}
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onTimeUpdate={() => !isSyncing && setCurrentTime(videoRef.current?.currentTime ?? 0)}
                    onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
                    onWaiting={() => setBuffering(true)}
                    onCanPlay={() => setBuffering(false)}
                    onClick={handlePlayPause}
                />

                {/* Buffering Indicator */}
                {buffering && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}

                {/* Sync Indicator */}
                {isSyncing && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-brand-purple/90 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
                        Syncing...
                    </div>
                )}

                {/* Non-Host Message */}
                {partyId && !isHost && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                        Host is controlling playback
                    </div>
                )}

                {/* Controls Overlay */}
                <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    {/* Top Bar - Title */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
                        <h2 className="text-white text-xl font-bold">{title}</h2>
                    </div>

                    {/* Center Play Button */}
                    {!isPlaying && !buffering && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <button
                                onClick={handlePlayPause}
                                disabled={!!(partyId && !isHost)}
                                className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play size={40} className="text-white ml-1" fill="currentColor" />
                            </button>
                        </div>
                    )}

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                        {/* Progress Bar */}
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
                                    className="w-full h-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer disabled:cursor-not-allowed"
                                    style={{
                                        background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
                                    }}
                                />
                            </div>
                            <span className="text-white text-sm font-medium min-w-[45px]">
                                {formatTime(duration)}
                            </span>
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {/* Play/Pause */}
                                <button
                                    onClick={handlePlayPause}
                                    disabled={!!(partyId && !isHost)}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                </button>

                                {/* Skip Backward */}
                                <button
                                    onClick={() => handleSkip(-10)}
                                    disabled={!!(partyId && !isHost)}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SkipBack size={18} />
                                </button>

                                {/* Skip Forward */}
                                <button
                                    onClick={() => handleSkip(10)}
                                    disabled={!!(partyId && !isHost)}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SkipForward size={18} />
                                </button>

                                {/* Volume */}
                                <div className="flex items-center gap-2 group/volume">
                                    <button
                                        onClick={toggleMute}
                                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
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
                                >
                                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
