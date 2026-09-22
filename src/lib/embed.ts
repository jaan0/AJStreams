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
