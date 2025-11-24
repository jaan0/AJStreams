'use client';

import { RefreshCw, AlertTriangle } from 'react-feather';

export default function VideoErrorFallback() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-white z-50">
            <div className="bg-red-500/10 p-6 rounded-full mb-4">
                <AlertTriangle size={48} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Video Player Error</h3>
            <p className="text-zinc-400 mb-6 text-center max-w-md">
                We encountered an issue loading the video player. This might be due to a connection issue or a temporary glitch.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors"
            >
                <RefreshCw size={20} />
                Reload Page
            </button>
        </div>
    );
}
