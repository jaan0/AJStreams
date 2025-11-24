import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'MyFlix - Stream Your Favorites',
    description: 'The best place to watch movies and TV shows.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    <Navbar />
                    <main className="min-h-screen bg-black text-white pt-16">
                        {children}
                    </main>
                    <Toaster position="top-center" toastOptions={{
                        style: {
                            background: '#333',
                            color: '#fff',
                        },
                    }} />
                </Providers>
            </body>
        </html>
    );
}
