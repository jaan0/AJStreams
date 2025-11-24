'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import VideoPlayer from '@/components/VideoPlayer';
import { ArrowLeft } from 'react-feather';
import Pusher, { Channel } from 'pusher-js';
import WatchPartyChat from '@/components/WatchPartyChat';
import ErrorBoundary from '@/components/ErrorBoundary';
import VideoErrorFallback from '@/components/VideoErrorFallback';
import ChatErrorFallback from '@/components/ChatErrorFallback';

interface Movie {
    _id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    genre: string[];
    year: number;
}

export default function MoviePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();

    const movieId = params.id as string;
    const partyId = searchParams.get('party');

    const [movie, setMovie] = useState<Movie | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [channel, setChannel] = useState<Channel | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [shareCode, setShareCode] = useState<string | null>(null);

    useEffect(() => {
        if (movieId) {
            fetchMovie();
        }
    }, [movieId]);

    useEffect(() => {
        if (partyId && session?.user) {
            const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
            const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

            if (!pusherKey) {
                console.error('Pusher key is missing. Please check NEXT_PUBLIC_PUSHER_KEY in .env.local');
                return;
            }

            const pusher = new Pusher(pusherKey, {
                cluster: pusherCluster || 'mt1',
                authEndpoint: '/api/pusher/auth',
            });

            const channelName = `private-watch-party-${partyId}`;
            const subscribedChannel = pusher.subscribe(channelName);
            setChannel(subscribedChannel);

            checkHostStatus();

            return () => {
                pusher.unsubscribe(channelName);
                pusher.disconnect();
            };
        }
    }, [partyId, session]);

    const checkHostStatus = async () => {
        if (!partyId || !session?.user?.email) return;
        try {
            // Fetch party details by ID
            const res = await fetch(`/api/watch-party?id=${partyId}`);
            if (res.ok) {
                const currentParty = await res.json();
                if (currentParty) {
                    if (currentParty.host.email === session.user.email) {
                        setIsHost(true);
                    }
                    setShareCode(currentParty.shareCode);
                }
            }
        } catch (error) {
            console.error('Failed to check host status:', error);
        }
    };

    const fetchMovie = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/movies/${movieId}`);

            if (res.ok) {
                const data = await res.json();
                setMovie(data);
            } else {
                console.error('Movie not found');
                router.push('/');
            }
        } catch (error) {
            console.error('Failed to fetch movie:', error);
            router.push('/');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    if (!movie) {
        return null;
    }

    return (
        <div className="min-h-screen bg-black flex overflow-hidden">
            {/* Main Content Area */}
            <div
                className={`relative flex-1 flex flex-col transition-all duration-300 ease-in-out ${partyId && isChatOpen ? 'mr-0 md:mr-80 lg:mr-96' : ''
                    }`}
            >
                {/* Back Button */}
                <div className="absolute top-4 left-4 z-50">
                    <button
                        onClick={handleClose}
                        className="flex items-center gap-2 px-4 py-2 bg-black/80 hover:bg-black/90 rounded-lg text-white transition-colors backdrop-blur-sm"
                    >
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </button>
                </div>

                {/* Video Player */}
                <div className="flex-1 relative">
                    <ErrorBoundary fallback={<VideoErrorFallback />}>
                        <VideoPlayer
                            videoUrl={movie.videoUrl}
                            title={movie.title}
                            onClose={handleClose}
                            channel={channel}
                            partyId={partyId || undefined}
                            isHost={isHost}
                        />
                    </ErrorBoundary>
                </div>
            </div>

            {/* Watch Party Chat Sidebar */}
            {partyId && session?.user && channel && (
                <div
                    className={`fixed right-0 top-0 bottom-0 z-[70] transition-all duration-300 ease-in-out ${isChatOpen ? 'w-full md:w-80 lg:w-96 translate-x-0' : 'w-0 translate-x-full'
                        }`}
                >
                    <ErrorBoundary fallback={<ChatErrorFallback />}>
                        <WatchPartyChat
                            channel={channel}
                            partyId={partyId}
                            isHost={isHost}
                            shareCode={shareCode || undefined}
                            onToggleMinimize={() => setIsChatOpen(!isChatOpen)}
                            isMinimized={false}
                        />
                    </ErrorBoundary>
                </div>
            )}

            {/* Minimized Chat Button */}
            {partyId && !isChatOpen && session?.user && channel && (
                <div className="fixed top-4 right-4 z-[80]">
                    <WatchPartyChat
                        channel={channel}
                        partyId={partyId}
                        isHost={isHost}
                        shareCode={shareCode || undefined}
                        onToggleMinimize={() => setIsChatOpen(true)}
                        isMinimized={true}
                    />
                </div>
            )}
        </div>
    );
}
