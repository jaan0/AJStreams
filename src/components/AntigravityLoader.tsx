'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const AJStreamsLoader = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center z-50">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-pink/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            {/* Loader Content */}
            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Logo */}
                <div className="relative w-32 h-32 mb-4 animate-bounce">
                    <Image
                        src="/logo.png"
                        alt="AJStreams"
                        fill
                        className="object-contain drop-shadow-2xl"
                        priority
                    />
                </div>

                {/* Brand Name */}
                <div className="text-center">
                    <h1 className="text-5xl font-bold bg-gradient-brand bg-clip-text text-transparent mb-2">
                        AJStreams
                    </h1>
                    <p className="text-zinc-400 text-sm tracking-wider">
                        Your Premium Streaming Experience
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-brand transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Loading Text */}
                <p className="text-zinc-500 text-sm animate-pulse">
                    Loading your next experience...
                </p>

                {/* Floating Particles */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-brand-purple/30 rounded-full animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${3 + Math.random() * 2}s`,
                            }}
                        />
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                        opacity: 0;
                    }
                    50% {
                        transform: translateY(-20px) translateX(10px);
                        opacity: 1;
                    }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default AJStreamsLoader;
