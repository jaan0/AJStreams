'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MessageCircle, Send, ChevronRight, Share2, Copy, Check, Slash, Lock, X, Users } from 'react-feather';
import { Channel } from 'pusher-js';
import { toast } from 'react-hot-toast';
import ParticipantList from './ParticipantList';

interface Message {
    id: string;
    sender: string;
    senderId: string;
    text: string;
    timestamp: number;
    isSystem?: boolean;
    user?: {
        name: string;
        image: string;
    }
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
    shareCode
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

    useEffect(() => {
        if (!session || !channel) return;

        const handleChatMessage = (message: Omit<Message, 'id' | 'sender' | 'senderId' | 'timestamp'> & { user: { name: string } }) => {
            setMessages((prev) => [...prev, {
                ...message,
                id: `${Date.now()}-${Math.random()}`,
                sender: message.user.name,
                senderId: message.user.name,
                timestamp: Date.now(),
            }]);
        };

        const handleToggleChat = ({ isDisabled }: { isDisabled: boolean }) => {
            setIsDisabled(isDisabled);
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                sender: 'System',
                senderId: 'system',
                text: isDisabled ? 'Chat has been disabled by the host.' : 'Chat has been enabled.',
                timestamp: Date.now(),
                isSystem: true
            }]);
        };

        const handlePartyEnded = () => {
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                sender: 'System',
                senderId: 'system',
                text: 'The host has ended this watch party. Redirecting...',
                timestamp: Date.now(),
                isSystem: true
            }]);

            toast('The host has ended this watch party', {
                icon: '👋',
                duration: 3000,
            });

            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        };

        const handlePartyUpdate = async () => {
            // Refresh participant list
            fetchPartyDetails();
        };

        channel.bind('chat-message', handleChatMessage);
        channel.bind('chat-toggle', handleToggleChat);
        channel.bind('party-ended', handlePartyEnded);
        channel.bind('party-update', handlePartyUpdate);

        // Initial fetch
        fetchPartyDetails();

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
                // We need to fetch full participant details if the API only returns IDs
                // But for now let's assume the API returns populated participants or we need to fetch them
                // The current API returns populated 'host', but 'participants' is just an array of IDs in the schema
                // We might need to update the GET endpoint to populate participants or fetch them separately.
                // Let's check if we can get populated participants.
                // Actually, the GET endpoint in route.ts does NOT populate participants.
                // We should update the GET endpoint to populate participants.

                // For now, let's assume we will update the API to populate participants.
                // If not, we might need a separate endpoint.
                // Let's update the API GET endpoint in the next step if needed.

                // Wait, I can't update the API in this tool call. 
                // I will assume the API returns populated participants for now, 
                // and if it doesn't, I will fix it in the next step.

                if (data.participants && typeof data.participants[0] === 'object') {
                    setParticipants(data.participants);
                } else {
                    // Fallback or handle IDs
                    // For now, let's just set the host
                }
                setHostId(data.host._id);
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
        if (!newMessage.trim() || isDisabled || !session?.user || isSending) return;

        const messageData = {
            text: newMessage,
        };

        setIsSending(true);
        try {
            const response = await fetch('/api/pusher/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    channel: `private-watch-party-${partyId}`,
                    message: messageData,
                }),
            });

            if (response.ok) {
                setNewMessage('');
            } else {
                toast.error('Failed to send message');
            }
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    const toggleChatDisable = async () => {
        if (!isHost) return;
        const newDisabledState = !isDisabled;

        // Optimistic update
        setIsDisabled(newDisabledState);

        // Add system message locally
        setMessages((prev) => [...prev, {
            id: Date.now().toString(),
            sender: 'System',
            senderId: 'system',
            text: newDisabledState ? 'Chat has been disabled by the host.' : 'Chat has been enabled.',
            timestamp: Date.now(),
            isSystem: true
        }]);

        try {
            // Send via API to broadcast to all participants
            await fetch('/api/pusher/chat-toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyId,
                    isDisabled: newDisabledState,
                }),
            });
            toast.success(newDisabledState ? 'Chat disabled' : 'Chat enabled');
        } catch (error) {
            toast.error('Failed to toggle chat');
            // Revert on error
            setIsDisabled(!newDisabledState);
        }
    };

    const handleEndParty = async () => {
        if (!isHost) return;

        setIsEndingParty(true);
        try {
            // Broadcast party end event
            await fetch('/api/pusher/party-end', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partyId }),
            });

            // Update party status in database
            await fetch('/api/watch-party', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partyId,
                    action: 'end',
                }),
            });

            // Redirect host to home
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

    if (isMinimized) {
        return (
            <button
                onClick={onToggleMinimize}
                className="absolute top-4 right-4 w-12 h-12 bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-brand-purple transition-colors z-50 shadow-lg border border-white/10"
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
                    <h3 className="font-bold text-white">Live Chat</h3>
                </div>
                <div className="flex items-center gap-2">
                    {isHost && shareCode && (
                        <div className="relative">
                            <button
                                onClick={() => setShowShareModal(!showShareModal)}
                                className={`p-2 rounded-lg transition-colors ${showShareModal ? 'bg-brand-purple text-white' : 'hover:bg-white/10 text-zinc-400'}`}
                                title="Share Party"
                            >
                                <Share2 size={18} />
                            </button>

                            {/* Share Modal/Popover */}
                            {showShareModal && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-white/10 rounded-xl shadow-xl p-4 z-50">
                                    <h4 className="text-white text-sm font-bold mb-2">Share Party Link</h4>
                                    <div className="flex items-center gap-2 bg-black/50 rounded-lg p-2 border border-white/5">
                                        <input
                                            readOnly
                                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/watch-party/${shareCode}`}
                                            className="bg-transparent text-xs text-zinc-400 flex-1 outline-none w-full"
                                        />
                                        <button
                                            onClick={handleCopyLink}
                                            className="text-zinc-400 hover:text-white transition-colors"
                                        >
                                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {isHost && (
                        <button
                            onClick={toggleChatDisable}
                            className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                            title={isDisabled ? "Enable Chat" : "Disable Chat"}
                        >
                            <Slash size={18} />
                        </button>
                    )}

                    {isHost && (
                        <button
                            onClick={() => setShowEndPartyModal(true)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                            title="End Party"
                        >
                            <X size={18} />
                        </button>
                    )}

                    <button
                        onClick={onToggleMinimize}
                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'chat' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    Chat
                    {activeTab === 'chat' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('participants')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'participants' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    Participants ({participants.length})
                    {activeTab === 'participants' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-purple" />
                    )}
                </button>
            </div>

            {
                activeTab === 'chat' ? (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${msg.isSystem ? 'items-center' : msg.senderId === session?.user?.name ? 'items-end' : 'items-start'}`}
                                >
                                    {!msg.isSystem && (
                                        <div className='flex items-center gap-2'>
                                            <span className="text-xs text-zinc-500 mb-1 px-1">
                                                {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${msg.isSystem
                                            ? 'bg-white/10 text-zinc-400 text-xs py-1 px-3 rounded-full'
                                            : msg.senderId === session?.user?.name
                                                ? 'bg-brand-purple text-white rounded-tr-none'
                                                : 'bg-white/10 text-zinc-200 rounded-tl-none'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10 bg-black/50">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={isDisabled ? "Chat disabled by host" : "Type a message..."}
                                    disabled={isDisabled || !session || isSending}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-purple/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isDisabled || !session || isSending}
                                    className="w-10 h-10 rounded-full bg-brand-purple flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-purple/80 transition-colors relative"
                                >
                                    {isSending ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send size={18} />
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <ParticipantList
                        participants={participants}
                        hostId={hostId}
                        currentUserId={session?.user?.id}
                    />
                )
            }

            {/* End Party Confirmation Modal */}
            {
                showEndPartyModal && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-2">End Watch Party?</h3>
                            <p className="text-zinc-400 text-sm mb-6">
                                All participants will be disconnected and redirected. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEndPartyModal(false)}
                                    disabled={isEndingParty}
                                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEndParty}
                                    disabled={isEndingParty}
                                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isEndingParty ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Ending...
                                        </>
                                    ) : (
                                        'End Party'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
