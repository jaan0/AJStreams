/**
 * Utility functions for parsing and formatting Bingr embeds and general video embed URLs.
 * 
 * Bingr URL Patterns supported:
 * - Movie: https://bingr.one/watch/movie/{tmdbId}
 * - Series Episode: https://bingr.one/watch/tv/{tmdbId}/{season}/{episode}
 * - Anime Episode (Anilist): https://bingr.one/watch/anime/{anilistId}/{episode}
 * - Anime Episode (MAL): https://bingr.one/watch/anime/mal-{malId}/{episode}
 */

export interface EmbedInfo {
    embedUrl: string;
    isIframe: boolean;
    isBingr: boolean;
    rawInput: string;
}

/**
 * Extracts src from an iframe tag if provided as HTML, or cleans up user input.
 */
export function extractIframeSrc(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();
    
    // Check if input is an HTML <iframe> string
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
        return match[1];
    }
    
    return trimmed;
}

/**
 * Parses any input (TMDB ID, Bingr URL, iframe snippet, or standard URL)
 * into a clean embed structure.
 */
export function parseEmbedUrl(input: string): EmbedInfo {
    if (!input) {
        return { embedUrl: '', isIframe: false, isBingr: false, rawInput: '' };
    }

    const cleanInput = extractIframeSrc(input);

    // If input is purely numeric (e.g. "1007757"), treat as TMDB Movie ID for Bingr
    if (/^\d+$/.test(cleanInput)) {
        const embedUrl = `https://bingr.one/watch/movie/${cleanInput}`;
        return { embedUrl, isIframe: true, isBingr: true, rawInput: input };
    }

    // If input starts with watch/ or /watch/
    if (cleanInput.startsWith('/watch/') || cleanInput.startsWith('watch/')) {
        const path = cleanInput.startsWith('/') ? cleanInput : `/${cleanInput}`;
        const embedUrl = `https://bingr.one${path}`;
        return { embedUrl, isIframe: true, isBingr: true, rawInput: input };
    }

    // If input is a Bingr URL
    if (cleanInput.includes('bingr.one')) {
        return { embedUrl: cleanInput, isIframe: true, isBingr: true, rawInput: input };
    }

    // Check if it's an iframe embed or external video service URL vs direct video file (.mp4, .webm, .ogg, .m3u8)
    const isDirectFile = /\.(mp4|webm|ogg|m3u8)($|\?)/i.test(cleanInput);
    const isIframe = !isDirectFile && (cleanInput.startsWith('http://') || cleanInput.startsWith('https://'));

    return {
        embedUrl: cleanInput,
        isIframe,
        isBingr: false,
        rawInput: input,
    };
}

/**
 * Generates Bingr URL helper options
 */
export function createBingrMovieUrl(tmdbId: string | number): string {
    return `https://bingr.one/watch/movie/${tmdbId}`;
}

export function createBingrTvUrl(tmdbId: string | number, season: string | number, episode: string | number): string {
    return `https://bingr.one/watch/tv/${tmdbId}/${season}/${episode}`;
}

export function createBingrAnimeUrl(anilistId: string | number, episode: string | number): string {
    return `https://bingr.one/watch/anime/${anilistId}/${episode}`;
}

export function createBingrAnimeMalUrl(malId: string | number, episode: string | number): string {
    return `https://bingr.one/watch/anime/mal-${malId}/${episode}`;
}

export interface BingrTvParams {
    isBingrTv: boolean;
    tmdbId?: string;
    season?: number;
    episode?: number;
}

/**
 * Extracts tmdbId, season, and episode numbers from any Bingr TV embed URL.
 * Matches patterns like https://bingr.one/watch/tv/76479/1/1 or /watch/tv/76479/2/5
 */
export function extractBingrTvParams(input: string): BingrTvParams {
    if (!input) return { isBingrTv: false };
    const clean = extractIframeSrc(input);
    const match = clean.match(/watch\/tv\/([0-9a-zA-Z_-]+)\/(\d+)\/(\d+)/i);
    if (match) {
        return {
            isBingrTv: true,
            tmdbId: match[1],
            season: parseInt(match[2], 10),
            episode: parseInt(match[3], 10),
        };
    }
    return { isBingrTv: false };
}

/**
 * Builds a Bingr series episode embed URL.
 */
export function buildBingrTvUrl(
    tmdbId: string | number,
    season: string | number,
    episode: string | number
): string {
    return `https://bingr.one/watch/tv/${tmdbId}/${season}/${episode}`;
}

export type StreamServer = 'bingr' | 'vidlink' | 'multiembed';

export interface ServerOption {
    id: StreamServer;
    name: string;
    badge: string;
    icon: string;
    tagline: string;
}

export const STREAM_SERVERS: ServerOption[] = [
    {
        id: 'bingr',
        name: 'Bingr',
        badge: '🎬 Default',
        icon: '🎬',
        tagline: 'Bingr Player',
    },
    {
        id: 'vidlink',
        name: 'VidLink',
        badge: '⚡ Ad-Lite',
        icon: '⚡',
        tagline: 'Minimal ads & clean streaming',
    },
    {
        id: 'multiembed',
        name: 'MultiEmbed',
        badge: '🍿 Multi',
        icon: '🍿',
        tagline: 'Multi-source stream provider',
    },
];

/**
 * Extracts a TMDB ID from any embed URL (Bingr, VidLink, MultiEmbed, or raw ID).
 */
export function extractTmdbId(input: string): string | null {
    if (!input) return null;
    const clean = extractIframeSrc(input);
    if (/^\d+$/.test(clean.trim())) return clean.trim();
    const movieMatch = clean.match(/watch\/movie\/(\d+)/i);
    if (movieMatch) return movieMatch[1];
    const tvMatch = clean.match(/watch\/tv\/(\d+)/i);
    if (tvMatch) return tvMatch[1];
    const vidlinkMatch = clean.match(/vidlink\.pro\/(?:movie|tv)\/(\d+)/i);
    if (vidlinkMatch) return vidlinkMatch[1];
    const multiMatch = clean.match(/video_id=(\d+)/i);
    if (multiMatch) return multiMatch[1];
    return null;
}

/**
 * Generates stream embed URL for any chosen server (Bingr, VidLink, MultiEmbed)
 */
export function buildServerUrl(
    server: StreamServer,
    mediaType: 'movie' | 'tv',
    tmdbId: string | number,
    season: number = 1,
    episode: number = 1
): string {
    const id = tmdbId.toString();

    if (server === 'vidlink') {
        return mediaType === 'tv'
            ? `https://vidlink.pro/tv/${id}/${season}/${episode}`
            : `https://vidlink.pro/movie/${id}`;
    }

    if (server === 'multiembed') {
        return mediaType === 'tv'
            ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`
            : `https://multiembed.mov/?video_id=${id}&tmdb=1`;
    }

    // Default: Bingr
    return mediaType === 'tv'
        ? `https://bingr.one/watch/tv/${id}/${season}/${episode}`
        : `https://bingr.one/watch/movie/${id}`;
}


