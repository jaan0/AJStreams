'use client';

// Registers the service worker for PWA functionality
import { useEffect } from 'react';

export default function PWARegister() {
    useEffect(() => {
        if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/', updateViaCache: 'none' })
                .then((registration) => {
                    console.log('[AJStreams PWA] Service Worker registered:', registration.scope);
                })
                .catch((err) => {
                    console.warn('[AJStreams PWA] Service Worker registration failed:', err);
                });
        }
    }, []);

    return null;
}

