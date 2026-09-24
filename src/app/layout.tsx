import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import AppShell from '@/components/AppShell';
import BottomNav from '@/components/BottomNav';
import { Toaster } from 'react-hot-toast';
import PWAInstallBanner from '@/components/PWAInstallBanner';
import PWARegister from '@/components/PWARegister';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import BackToTop from '@/components/BackToTop';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    title: 'AJStreams — Stream Movies & TV Shows',
    description: 'Watch movies and TV shows online for free on AJStreams. Binge your favorites with HD quality streaming.',
    keywords: ['streaming', 'movies', 'tv shows', 'watch free', 'ajstreams'],
    authors: [{ name: 'AJStreams' }],
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        title: 'AJStreams',
        statusBarStyle: 'black-translucent',
    },
    icons: {
        icon: [
            { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [
            { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
            { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        ],
        shortcut: '/icons/icon-192x192.png',
    },
    openGraph: {
        title: 'AJStreams — Stream Movies & TV Shows',
        description: 'Watch movies and TV shows online for free.',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'AJStreams — Stream Movies & TV Shows',
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    userScalable: true,
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#0f1014' },
        { media: '(prefers-color-scheme: dark)', color: '#0f1014' },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                {/* PWA & iOS meta */}
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="AJStreams" />
                <meta name="application-name" content="AJStreams" />
                <meta name="msapplication-TileColor" content="#0f1014" />
                <meta name="format-detection" content="telephone=no" />
                {/* Splash screens for iOS */}
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
            </head>
            <body className={`${inter.className} pb-safe`}>
                <Providers>
                    <Navbar />
                    <AppShell>
                        {children}
                    </AppShell>
                    <BottomNav />
                    <PWAInstallBanner />
                    <PWARegister />
                    <AnalyticsTracker />
                    <BackToTop />
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            style: {
                                background: '#18181c',
                                color: '#fff',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                            },
                        }}
                    />
                </Providers>
            </body>
        </html>
    );
}
