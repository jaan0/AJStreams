'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function usePlaybackHealth({ id, url, provider, mediaType, season, episode, frame }: { id?: string | null; url: string; provider: string; mediaType: 'movie' | 'tv'; season: number; episode: number; frame: React.RefObject<HTMLIFrameElement> }) {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [playerUrl, setPlayerUrl] = useState(url);
    const reported = useRef(new Set<string>());
    const report = useCallback((outcome: 'success' | 'failure') => {
        if (!id || !userId || reported.current.has(outcome)) return;
        reported.current.add(outcome);
        void fetch('/api/playback-health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, provider, outcome, mediaType, season, episode }), keepalive: true }).catch(() => {});
    }, [id, provider, mediaType, season, episode, userId]);
    useEffect(() => { reported.current.clear(); }, [id, url, provider, season, episode]);
    useEffect(() => {
        const nonce = crypto.randomUUID();
        let origin = '';
        try { origin = new URL(url).origin; } catch {}
        if (provider === 'vidlink' && origin === 'https://vidlink.pro') {
            const target = new URL(url);
            target.searchParams.set('fallback_url', `${window.location.origin}/playback-unavailable?nonce=${nonce}`);
            setPlayerUrl(target.href);
        } else setPlayerUrl(url);
        const message = (event: MessageEvent) => {
            if (event.source !== frame.current?.contentWindow) return;
            if (event.origin === window.location.origin && event.data?.type === 'AJSTREAMS_SOURCE_UNAVAILABLE' && event.data?.nonce === nonce && provider === 'vidlink') { report('failure'); return; }
            if (event.origin !== origin || !['https://vidlink.pro', 'https://bingr.one'].includes(origin)) return;
            const data = event.data?.type === 'PLAYER_EVENT' ? event.data.data : null;
            if (data && Number.isFinite(data.currentTime) && data.currentTime >= 5 && (data.event === 'timeupdate' || (data.event === 'playerstatus' && data.playing === true))) report('success');
        };
        window.addEventListener('message', message);
        return () => window.removeEventListener('message', message);
    }, [url, provider, frame, report]);
    return { playerUrl, report };
}
