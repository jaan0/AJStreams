import { User, Award, Circle } from 'react-feather';

interface Participant {
    _id: string;
    name: string;
    email: string;
}

interface ParticipantListProps {
    participants: Participant[];
    hostId: string;
    currentUserId?: string;
}

export default function ParticipantList({ participants, hostId, currentUserId }: ParticipantListProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {participants.map((participant) => {
                const isHost = participant._id === hostId;
                const isMe = participant._id === currentUserId;

                return (
                    <div
                        key={participant._id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isMe ? 'bg-white/10 border border-white/5' : 'hover:bg-white/5'
                            }`}
                    >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${isHost
                            ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                            : 'bg-gradient-to-br from-brand-purple to-brand-pink'
                            }`}>
                            {participant.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-white font-medium truncate">
                                    {participant.name}
                                    {isMe && <span className="text-zinc-500 font-normal ml-2">(You)</span>}
                                </p>
                                {isHost && (
                                    <Award size={14} className="text-yellow-400 fill-current" />
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 truncate">{participant.email}</p>
                        </div>

                        {/* Status Indicator (Simulated for now) */}
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Online</span>
                            </div>
                        </div>
                    </div>
                );
            })}

            {participants.length === 0 && (
                <div className="text-center py-10 text-zinc-500">
                    <User size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No participants yet</p>
                </div>
            )}
        </div>
    );
}
