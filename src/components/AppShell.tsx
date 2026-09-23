'use client';

import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPlayer = pathname?.startsWith('/watch/') || pathname?.startsWith('/movie/') || pathname?.startsWith('/watch-party/');
    return <main className={isPlayer ? 'player-shell' : 'app-shell'}>{children}</main>;
}
