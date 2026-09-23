'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Home, Search, Film, Bookmark, Users, User, PlusCircle, LogOut, Grid, HelpCircle } from 'react-feather';
import AuthModal from './AuthModal';
import RequestMovieModal from './RequestMovieModal';
import SearchModal from './SearchModal';

export default function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [showAuth, setShowAuth] = useState(false);
    const [showRequest, setShowRequest] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const isPlayer = pathname?.startsWith('/watch/') || pathname?.startsWith('/movie/') || pathname?.startsWith('/watch-party/');

    useEffect(() => {
        const keydown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') { event.preventDefault(); setShowSearch(value => !value); }
            if (event.key === 'Escape') { setShowAuth(false); setShowSearch(false); setShowRequest(false); }
        };
        window.addEventListener('keydown', keydown);
        if (new URLSearchParams(window.location.search).get('login') === 'true') setShowAuth(true);
        return () => window.removeEventListener('keydown', keydown);
    }, []);

    const links = [
        { href: '/', label: 'Home', Icon: Home },
        { href: '/movies', label: 'Movies & TV', Icon: Film },
        { href: '/my-list', label: 'My List', Icon: Bookmark },
        { href: '/watch-parties', label: 'Watch Parties', Icon: Users },
        { href: '/account', label: 'My Space', Icon: User },
    ];

    return <>
        {!isPlayer && <>
            <aside className="navigation-rail">
                <Link href="/" aria-label="AJStreams home" className="rail-brand"><span className="brand-symbol">a<span>j</span></span><span className="rail-label brand-name">AJStreams</span></Link>
                <nav aria-label="Main navigation" className="rail-links">
                    {links.slice(0, 1).map(({ href, label, Icon }) => <Link key={href} href={href} aria-label={label} aria-current={pathname === href ? 'page' : undefined} className={`rail-link ${pathname === href ? 'active' : ''}`}><Icon size={23} /><span className="rail-label">{label}</span></Link>)}
                    <button className="rail-link" aria-label="Search library" onClick={() => setShowSearch(true)}><Search size={23} /><span className="rail-label">Search <kbd>⌘ K</kbd></span></button>
                    {links.slice(1).map(({ href, label, Icon }) => <Link key={href} href={href} aria-label={label} aria-current={pathname?.startsWith(href) ? 'page' : undefined} className={`rail-link ${pathname?.startsWith(href) ? 'active' : ''}`}><Icon size={23} /><span className="rail-label">{label}</span></Link>)}
                    <button className="rail-link" aria-label="Request a title" onClick={() => setShowRequest(true)}><PlusCircle size={23} /><span className="rail-label">Request a title</span></button>
                    {session?.user && (session.user as { role?: string }).role === 'admin' && <Link href="/admin" className="rail-link" aria-label="Admin"><Grid size={23} /><span className="rail-label">Admin</span></Link>}
                </nav>
                <div className="rail-bottom">
                    <Link href="/help" className="rail-link" aria-label="Help center"><HelpCircle size={21} /><span className="rail-label">Help center</span></Link>
                    <button className="rail-link" aria-label={session ? 'Sign out' : 'Sign in'} onClick={() => session ? signOut({ callbackUrl: '/' }) : setShowAuth(true)}>{session ? <LogOut size={21} /> : <User size={21} />}<span className="rail-label">{session ? 'Sign out' : 'Sign in'}</span></button>
                </div>
            </aside>
            <header className="mobile-header">
                <Link href="/" aria-label="AJStreams home" className="brand-name"><span className="brand-symbol">aj</span><span>AJStreams</span></Link>
                <div className="flex gap-2"><button className="icon-button" aria-label="Request a title" onClick={() => setShowRequest(true)}><PlusCircle size={20} /></button><button className="icon-button" aria-label="Search library" onClick={() => setShowSearch(true)}><Search size={20} /></button></div>
            </header>
        </>}
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
        <RequestMovieModal isOpen={showRequest} onClose={() => setShowRequest(false)} />
        <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>;
}
