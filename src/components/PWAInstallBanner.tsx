'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'react-feather';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Detect iOS
        const ua = navigator.userAgent;
        const ios = /iphone|ipad|ipod/i.test(ua);
        setIsIOS(ios);

        // Check if already installed as PWA
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (navigator as any).standalone === true;
        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Check dismissed preference
        const dismissed = localStorage.getItem('ajstreams_pwa_dismissed');
        if (dismissed) return;

        // Listen for Android/Chrome install prompt
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Show iOS banner after 3s if on Safari iOS
        if (ios) {
            const timer = setTimeout(() => setShowBanner(true), 3000);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            };
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
        }
        setShowBanner(false);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('ajstreams_pwa_dismissed', '1');
    };

    if (!showBanner || isInstalled) return null;

    return (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[200] animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-4 shadow-2xl shadow-purple-900/30 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0">
                        <img src="/logo.png" alt="AJStreams" className="w-8 h-8 object-contain" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">Install AJStreams</p>
                        <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
                            {isIOS
                                ? 'Tap the Share button then "Add to Home Screen"'
                                : 'Add to your home screen for the best experience'}
                        </p>

                        {!isIOS && deferredPrompt && (
                            <button
                                onClick={handleInstall}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                                <Download size={13} />
                                Install App
                            </button>
                        )}

                        {isIOS && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
                                <Smartphone size={12} />
                                <span>Tap ⬆️ Share → Add to Home Screen</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="text-zinc-500 hover:text-white transition-colors mt-0.5"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
