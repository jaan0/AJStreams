'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Bookmark, User, Search, Grid } from 'react-feather';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import SearchModal from './SearchModal';

export default function BottomNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [showSearch, setShowSearch] = useState(false);
    if (pathname?.startsWith('/watch/') || pathname?.startsWith('/movie/') || pathname?.startsWith('/watch-party/')) return null;
    const links = [{ href: '/', label: 'Home', Icon: Home }, { href: '/movies', label: 'Explore', Icon: Film }, { href: '/my-list', label: 'My List', Icon: Bookmark }, { href: '/account', label: 'My Space', Icon: User }];
    if ((session?.user as { role?: string } | undefined)?.role === 'admin') links.push({ href: '/admin', label: 'Admin', Icon: Grid });
    return <>
        <nav aria-label="Mobile navigation" className="mobile-dock">
            {links.slice(0, 1).map(({ href, label, Icon }) => <Link key={href} href={href} className={pathname === href ? 'active' : ''} aria-current={pathname === href ? 'page' : undefined}><Icon size={21} /><span>{label}</span></Link>)}
            <button onClick={() => setShowSearch(true)}><Search size={21} /><span>Search</span></button>
            {links.slice(1).map(({ href, label, Icon }) => <Link key={href} href={href} className={pathname?.startsWith(href) ? 'active' : ''} aria-current={pathname?.startsWith(href) ? 'page' : undefined}><Icon size={21} /><span>{label}</span></Link>)}
        </nav>
        <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>;
}
