'use client';

import Image from 'next/image';

const AJStreamsLoader = () => {
    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
            <div className="flex flex-col items-center gap-6">
                {/* Logo */}
                <div className="relative w-32 h-32">
                    <Image
                        src="/logo.png"
                        alt="AJStreams"
                        fill
                        sizes="128px"
                        className="object-contain"
                        priority
                    />
                </div>
                
                {/* Minimal Spinner */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-5 h-5 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
                    <p className="text-zinc-500 text-xs font-medium tracking-wide">
                        Loading...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AJStreamsLoader;
