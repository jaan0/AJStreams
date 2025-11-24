'use client';

import { WifiOff } from 'react-feather';

export default function ChatErrorFallback() {
    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-zinc-900/50 backdrop-blur-sm">
            <WifiOff size={32} className="text-zinc-500 mb-3" />
            <h3 className="text-sm font-bold text-zinc-300 mb-1">Chat Unavailable</h3>
            <p className="text-xs text-zinc-500 mb-4">
                We lost connection to the chat server.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
            >
                Reconnect
            </button>
        </div>
    );
}
