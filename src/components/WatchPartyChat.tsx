'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, ChevronRight, Share2, Copy, Check, Slash, Lock, X, Users } from 'react-feather';
import { Channel } from 'pusher-js';
import { toast } from 'react-hot-toast';
import ParticipantList from './ParticipantList';
import { getWatchPartyPreferences, playMessageChime } from '@/lib/watch-party-settings';

interface Message {
    id: string;
    sender: string;
    senderId: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
    user?: {
        name: string;
        image?: string;
    };
}

interface Participant {
    _id: string;
    name: string;
    email: string;
}

interface WatchPartyChatProps {
    channel: Channel;
    partyId: string;
    isHost?: boolean;
    onToggleMinimize?: () => void;
    isMinimized?: boolean;
    shareCode?: string;
}

export default function WatchPartyChat({
    channel,
    partyId,
    isHost = false,
    onToggleMinimize,
    isMinimized = false,
    shareCode,
}: WatchPartyChatProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isDisabled, setIsDisabled] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showEndPartyModal, setShowEndPartyModal] = useState(false);
    const [isEndingParty, setIsEndingParty] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [hostId, setHostId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isCurrentUser = (msg: Message) => {
        if (!session?.user) return false;
        const myId = (session.user as any).id;
        const myEmail = session.user.email;
        const myName = session.user.name;
        const myNick = getWatchPartyPreferences().nickname;
        return (
            (myId && msg.senderId === myId) ||
            (myEmail && (msg.senderId === myEmail || msg.senderId === myId)) ||
            (myName && (msg.senderId === myName || msg.sender === myName)) ||
            (myNick && msg.sender === myNick)
        );
    };

    const fetchChatHistory = async () => {
        if (!partyId) return;
        try {
            const res = await fetch(`/api/pusher/message?partyId=${partyId}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.messages) && data.messages.length > 0) {
                    setMessages((prev) => {
                        const existingIds = new Set(prev.map((m) => m.id));
                        const fresh = data.messages.filter((m: Message) => !existingIds.has(m.id));
                        if (fresh.length === 0) return prev;
                        return [...prev, ...fresh];
                    });
                }
            }
        } catch (err) {
            console.error('Failed to fetch chat history:', err);
        }
    };

    useEffect(() => {
        fetchPartyDetails();
        fetchChatHistory();

        // 3-second polling fallback so chat works even if Pusher isn't connected
        const interval = setInterval(fetchChatHistory, 3000);
        return () => clearInterval(interval);
    }, [partyId]);

    useEffect(() => {
        if (!session || !channel) return;

        const handleChatMessage = (payload: any) => {
            const incomingId = payload.id || `${Date.now()}-${Math.random()}`;
            setMessages((prev) => {
                // Deduplicate if already added optimistically or by ID
                const alreadyExists = prev.some(
                    (m) =>
                        m.id === incomingId ||
                        (m.text === payload.text &&
                            m.sender === (payload.user?.name || payload.sender) &&
                            Math.abs(m.timestamp - (payload.timestamp || Date.now())) < 4000)
                );
                if (alreadyExists) return prev;

                if (getWatchPartyPreferences().soundNotifications) {
                    playMessageChime();
                }

                return [
                    ...prev,
                    {
                        id: incomingId,
                        sender: payload.user?.name || payload.sender || 'Friend',
                        senderId: payload.user?.id || payload.senderId || payload.user?.name || 'user',
                        text: payload.text,
                        timestamp: payload.timestamp || Date.now(),
                        user: payload.user,
                    },
                ];
            });
        };

        const handleToggleChat = ({ isDisabled }: { isDisabled: boolean }) => {
            setIsDisabled(isDisabled);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    sender: 'System',
                    senderId: 'system',
                    text: isDisabled ? 'Chat has been disabled by the host.' : 'Chat has been enabled.',
                    timestamp: Date.now(),
                    isSystem: true,
                },
            ]);
        };

        const handlePartyEnded = () => {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    sender: 'System',
                    senderId: 'system',
                    text: 'The host has ended this watch party. Redirecting...',
                    timestamp: Date.now(),
                    isSystem: true,
                },
            ]);

            toast('The host has ended this watch party', {
                icon: '👋',
                duration: 3000,
            });

            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        };

        const handlePartyUpdate = async () => {
            fetchPartyDetails();
        };

        channel.bind('chat-message', handleChatMessage);
        channel.bind('chat-toggle', handleToggleChat);
        channel.bind('party-ended', handlePartyEnded);
        channel.bind('party-update', handlePartyUpdate);

        return () => {
            channel.unbind('chat-message', handleChatMessage);
            channel.unbind('chat-toggle', handleToggleChat);
            channel.unbind('party-ended', handlePartyEnded);
            channel.unbind('party-update', handlePartyUpdate);
        };
    }, [channel, session]);

    const fetchPartyDetails = async () => {
        try {
            const res = await fetch(`/api/watch-party?id=${partyId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.participants && typeof data.participants[0] === 'object') {
                    setParticipants(data.participants);
                }
                if (data.host?._id) {
                    setHostId(data.host._id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch party details', error);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newMessage.trim();
        if (!text || isDisabled || !session?.user || isSending) return;

        const currentPrefs = getWatchPartyPreferences();
        const senderName =
            currentPrefs.nickname.trim() ||
            session.user.name ||
            session.user.email?.split('@')[0] ||
            'You';
        const senderId =
            (session.user as any).id || session.user.email || session.user.name || 'me';

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const optimisticMsg: Message = {
            id: tempId,
            sender: senderName,
            senderId,
            text,
            timestamp: Date.now(),
        };

        // Optimistically add message right away so chat is instantaneous
        setMessages((prev) => [...prev, optimisticMsg]);
        setNewMessage('');
        setIsSending(true);

        try {
            const response = await fetch('/api/pusher/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channel: `private-watch-party-${partyId}`,
                    message: { text },
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                if (data.message?.id) {
                    setMessages((prev) =>
                        prev.map((m) => (m.id === tempId ? { ...m, id: data.message.id } : m))
                    );
                }
            } else {
                // Rollback optimistic message on failure
                setMessages((prev) => prev.filter((m) => m.id !== tempId));
                setNewMessage(text);
                toast.error(data.error || 'Failed to send message');
            }
        } catch (error: any) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            setNewMessage(text);
            toast.error(error.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const toggleChatDisable = async () => {
        if (!isHost) return;
        const newDisabledState = !isDisabled;

        setIsDisabled(newDisabledState);

        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                sender: 'System',
                senderId: 'system',
                text: newDisabledState
                    ? 'Chat has been disabled by the host.'
                    : 'Chat has been enabled.',
                timestamp: Date.now(),
                isSystem: true,
            },
        ]);

        try {
            const res = await fetch('/api/pusher/chat-toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyId,
                    isDisabled: newDisabledState,
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to toggle chat');
            }

            toast.success(newDisabledState ? 'Chat disabled' : 'Chat enabled');
        } catch (error) {
            toast.error('Failed to toggle chat');
            setIsDisabled(!newDisabledState);
        }
    };

    const handleEndParty = async () => {
        if (!isHost) return;

        setIsEndingParty(true);
        try {
            await fetch('/api/pusher/party-end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partyId }),
            });

            await fetch('/api/watch-party', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyId,
                    action: 'end',
                }),
            });

            window.location.href = '/';
        } catch (error) {
            toast.error('Failed to end party');
            setIsEndingParty(false);
        }
    };

    const handleCopyLink = () => {
        if (!shareCode) return;
        const link = `${window.location.origin}/watch-party/${shareCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (!shareCode) return;
        const link = `${window.location.origin}/watch-party/${shareCode}`;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: 'Join my Watch Party on AJStreams!',
                    text: `Come watch with me on AJStreams! Room Code: ${shareCode}`,
                    url: link,
                });
                return;
            } catch (err: any) {
                if (err.name !== 'AbortError') handleCopyLink();
                return;
            }
        }
        handleCopyLink();
    };

    if (isMinimized) {
        return (
            <button
                onClick={onToggleMinimize}
                className="absolute top-4 right-4 w-12 h-12 bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-brand-accent transition-colors z-50 shadow-lg border border-white/10"
                title="Open Chat"
            >
                <MessageCircle size={24} />
            </button>
        );
    }

    return (
        <div className="flex flex-col h-full bg-black/90 backdrop-blur-md border-l border-white/10 relative">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <h3 className="font-bold text-white text-sm">Live Chat</h3>
                </div>
                <div className="flex items-center gap-1.5">
                    {isHost && shareCode && (
                        <div className="relative">
                            <button
                                onClick={() => setShowShareModal(!showShareModal)}
                                className={`p-2 rounded-lg transition-colors ${
                                    showShareModal ? 'bg-brand-accent text-white' : 'hover:bg-white/10 text-zinc-400'
                                }`}
                                title="Share Party"
                            >
                                <Share2 size={16} />
                            </button>

                            {/* Share Modal/Popover */}
                            {showShareModal && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-xl p-4 z-50 space-y-3">
                                    <h4 className="text-white text-xs font-bold uppercase tracking-wider">Share Party Link</h4>
                                    <div className="flex items-center gap-2 bg-black/50 rounded-lg p-2 border border-white/5">
                                        <input
                                            readOnly
                                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/watch-party/${shareCode}`}
                                            className="bg-transparent text-xs text-zinc-400 flex-1 outline-none w-full"
                                        />
                                        <button
                                            onClick={handleCopyLink}
                                            className="text-zinc-400 hover:text-white transition-colors"
                                            title="Copy link"
                                        >
                                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleNativeShare}
                                        className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-1.5 rounded-lg"
                                    >
                                        <Share2 size={12} /> Share with Friends
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {isHost && (
                        <button
                            onClick={toggleChatDisable}
                            className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                            title={isDisabled ? 'Enable Chat' : 'Disable Chat'}
                        >
                            <Slash size={16} />
                        </button>
                    )}

                    {isHost && (
                        <button
                            onClick={() => setShowEndPartyModal(true)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                            title="End Party"
                        >
                            <X size={16} />
                        </button>
                    )}

                    <button
                        onClick={onToggleMinimize}
                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        title="Close chat panel"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                        activeTab === 'chat' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    Chat
                    {activeTab === 'chat' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('participants')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
                        activeTab === 'participants' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    Viewers ({participants.length || 1})
                    {activeTab === 'participants' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent" />
                    )}
                </button>
            </div>

            {activeTab === 'chat' ? (
                <>
                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        {messages.length === 0 && (
                            <div className="text-center py-12 text-zinc-500 text-xs space-y-1">
                                <Users size={28} className="mx-auto opacity-30 mb-2" />
                                <p className="font-semibold text-zinc-400">Welcome to the Watch Party!</p>
                                <p>Say hello to your friends to start chatting.</p>
                            </div>
                        )}

                        {messages.map((msg) => {
                            const isMe = isCurrentUser(msg);
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.isSystem ? 'items-center' : isMe ? 'items-end' : 'items-start'}`}
                                >
                                    {!msg.isSystem && (
                                        <div className="flex items-center gap-1.5 mb-1 px-1">
                                            <span className="text-[11px] font-semibold text-zinc-400">
                                                {isMe ? 'You' : msg.sender}
                                            </span>
                                            <span className="text-[10px] text-zinc-500">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                                            msg.isSystem
                                                ? 'bg-white/10 text-zinc-400 text-[11px] py-1 px-3 rounded-full text-center'
                                                : isMe
                                                ? 'bg-brand-accent text-white rounded-tr-none shadow-md'
                                                : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-white/5'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-3 border-t border-white/10 bg-black/60">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={isDisabled ? 'Chat disabled by host' : 'Type a message...'}
                                disabled={isDisabled || !session || isSending}
                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-white text-xs focus:outline-none focus:border-brand-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || isDisabled || !session || isSending}
                                className="w-9 h-9 rounded-full bg-brand-accent flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent/80 transition-colors shrink-0 shadow-md"
                            >
                                {isSending ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send size={15} />
                                )}
                            </button>
                        </form>
                    </div>
                </>
            ) : (
                <ParticipantList
                    participants={participants}
                    hostId={hostId}
                    currentUserId={(session?.user as any)?.id}
                />
            )}

            {/* End Party Confirmation Modal */}
            {showEndPartyModal && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2">End Watch Party?</h3>
                        <p className="text-zinc-400 text-xs mb-6">
                            All participants will be disconnected and redirected. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEndPartyModal(false)}
                                disabled={isEndingParty}
                                className="btn-ghost flex-1 py-2 text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEndParty}
                                disabled={isEndingParty}
                                className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {isEndingParty ? 'Ending...' : 'End Party'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
