'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User } from 'react-feather';
import AuthModal from '@/components/AuthModal';

export default function AccountPanel() {
    const { data: session, status } = useSession();
    const [showAuth, setShowAuth] = useState(false);

    if (status === 'loading') return <div role="status" className="rounded-card glass p-8 text-zinc-400">Loading your account…</div>;

    return (
        <section className="overflow-hidden rounded-card glass">
            <div className="h-24 bg-gradient-brand" />
            <div className="p-6 md:p-8">
                <div className="-mt-16 mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-zinc-900 bg-zinc-800"><User size={32} aria-hidden="true" /></div>
                <h2 className="text-2xl font-bold">{session ? `Welcome, ${session.user?.name || 'movie fan'}` : 'Make yourself at home'}</h2>
                <p className="mt-3 break-words leading-7 text-zinc-400">{session ? session.user?.email : 'Sign in or create an account to save favorites and join watch parties.'}</p>
                {session ? (
                    <>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/profile" className="btn-primary">View profile</Link>
                            <Link href="/my-list" className="btn-secondary">My List</Link>
                            <Link href="/watch-parties" className="btn-secondary">Watch Parties</Link>
                        </div>
                        <button type="button" onClick={() => signOut({ callbackUrl: '/account' })} className="mt-8 text-sm text-zinc-400 underline underline-offset-4 hover:text-white">Sign out</button>
                    </>
                ) : <button type="button" className="btn-primary mt-8" onClick={() => setShowAuth(true)}>Sign in / Create account</button>}
                <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
            </div>
        </section>
    );
}
