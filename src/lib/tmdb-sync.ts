import dbConnect from '@/lib/mongodb';
import Movie, { IMovie } from '@/models/Movie';
import { extractTmdbId, createBingrMovieUrl, createBingrTvUrl } from '@/lib/embed';

export interface TmdbSyncOptions {
    types?: 'both' | 'movies' | 'tv';
    startYear?: number;
    endYear?: number;
    maxPages?: number;
    minVoteCount?: number;
    apiKey?: string;
}

export interface AddedTitleInfo {
    title: string;
    year: number;
    type: 'movie' | 'tv';
    tmdbId: string;
    rating: number;
}

export interface TmdbSyncResult {
    success: boolean;
    totalDiscovered: number;
    addedCount: number;
    skippedCount: number;
    errorCount: number;
    addedTitles: AddedTitleInfo[];
    durationMs: number;
    message: string;
}

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Fallback genre dictionary for fast mapping without extra network calls
const GENRE_MAP: Record<number, string> = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Sci-Fi',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
    10759: 'Action & Adventure',
    10762: 'Kids',
    10763: 'News',
    10764: 'Reality',
    10765: 'Sci-Fi & Fantasy',
    10766: 'Soap',
    10767: 'Talk',
    10768: 'War & Politics',
};

/**
 * Fetches genres from TMDB API or returns the built-in dictionary
 */
async function fetchGenres(apiKey: string): Promise<Record<number, string>> {
    try {
        const [movieGen, tvGen] = await Promise.all([
            fetch(`${TMDB_BASE}/genre/movie/list?api_key=${apiKey}&language=en-US`),
            fetch(`${TMDB_BASE}/genre/tv/list?api_key=${apiKey}&language=en-US`),
        ]);
        const map = { ...GENRE_MAP };
        if (movieGen.ok) {
            const data = await movieGen.json();
            data.genres?.forEach((g: { id: number; name: string }) => {
                map[g.id] = g.name;
            });
        }
        if (tvGen.ok) {
            const data = await tvGen.json();
            data.genres?.forEach((g: { id: number; name: string }) => {
                map[g.id] = g.name;
            });
        }
        return map;
    } catch {
        return GENRE_MAP;
    }
}

/**
 * Executes a full sync from TMDB into the database with deduplication and year filtering.
 */
export async function syncTmdbContent(options: TmdbSyncOptions = {}): Promise<TmdbSyncResult> {
    const startTime = Date.now();
    const apiKey = options.apiKey || process.env.TMDB_API_KEY;

    if (!apiKey || apiKey === 'your-tmdb-api-key-here') {
        return {
            success: false,
            totalDiscovered: 0,
            addedCount: 0,
            skippedCount: 0,
            errorCount: 0,
            addedTitles: [],
            durationMs: 0,
            message: 'TMDB_API_KEY is not configured in .env.local',
        };
    }

    const {
        types = 'both',
        startYear = 2023,
        endYear = 2026,
        maxPages = 5,
        minVoteCount = 15,
    } = options;

    await dbConnect();

    // 1. Gather all existing TMDB IDs & Title signatures from DB to guarantee 0 duplicates
    const existingMovies = await Movie.find({}, { videoUrl: 1, title: 1, year: 1 }).lean();
    const existingTmdbIds = new Set<string>();
    const existingTitleKeys = new Set<string>();

    for (const m of existingMovies) {
        const tmdbId = extractTmdbId(m.videoUrl);
        if (tmdbId) existingTmdbIds.add(tmdbId);
        if (m.title && m.year) {
            existingTitleKeys.add(`${m.title.toLowerCase().trim()}_${m.year}`);
        }
    }

    const genreMap = await fetchGenres(apiKey);

    const typesToFetch: Array<'movie' | 'tv'> =
        types === 'both' ? ['movie', 'tv'] : [types === 'movies' ? 'movie' : 'tv'];

    let totalDiscovered = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const toInsert: Array<{
        title: string;
        description: string;
        posterUrl: string;
        videoUrl: string;
        genre: string[];
        rating: number;
        year: number;
        featured: boolean;
        views: number;
    }> = [];
    const addedTitles: AddedTitleInfo[] = [];

    for (const contentType of typesToFetch) {
        for (let page = 1; page <= maxPages; page++) {
            try {
                let url = '';
                if (contentType === 'movie') {
                    url = `${TMDB_BASE}/discover/movie?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${page}&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31&vote_count.gte=${minVoteCount}`;
                } else {
                    url = `${TMDB_BASE}/discover/tv?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&include_adult=false&include_null_first_air_dates=false&page=${page}&first_air_date.gte=${startYear}-01-01&first_air_date.lte=${endYear}-12-31&vote_count.gte=${minVoteCount}`;
                }

                const res = await fetch(url, { headers: { Accept: 'application/json' } });
                if (!res.ok) {
                    errorCount++;
                    continue;
                }

                const data = await res.json();
                const results = data.results || [];
                totalDiscovered += results.length;

                for (const item of results) {
                    const idStr = String(item.id);
                    const title = (item.title || item.name || '').trim();
                    const rawDate = item.release_date || item.first_air_date;
                    const year = rawDate ? new Date(rawDate).getFullYear() : 0;

                    // Must have title, valid poster image, and year within range
                    if (!title || !item.poster_path || year < startYear || year > endYear) {
                        skippedCount++;
                        continue;
                    }

                    const titleKey = `${title.toLowerCase()}_${year}`;

                    // Check if already in database or already staged in this batch
                    if (existingTmdbIds.has(idStr) || existingTitleKeys.has(titleKey)) {
                        skippedCount++;
                        continue;
                    }

                    // Map genres
                    const genres: string[] = (item.genre_ids || [])
                        .map((gid: number) => genreMap[gid])
                        .filter(Boolean);

                    if (genres.length === 0) {
                        genres.push(contentType === 'tv' ? 'TV Show' : 'Movie');
                    }

                    const rating = Math.round((item.vote_average || 0) * 10) / 10;
                    const posterUrl = `${TMDB_IMAGE_BASE}${item.poster_path}`;
                    const videoUrl =
                        contentType === 'tv'
                            ? createBingrTvUrl(idStr, 1, 1)
                            : createBingrMovieUrl(idStr);

                    // Add to staged insert list
                    toInsert.push({
                        title,
                        description: item.overview || `Watch ${title} online in HD quality on AJStreams.`,
                        posterUrl,
                        videoUrl,
                        genre: genres,
                        rating,
                        year,
                        featured: false,
                        views: 0,
                    });

                    addedTitles.push({
                        title,
                        year,
                        type: contentType,
                        tmdbId: idStr,
                        rating,
                    });

                    // Mark as seen so duplicates inside the same batch are skipped
                    existingTmdbIds.add(idStr);
                    existingTitleKeys.add(titleKey);
                }

                // If fewer than 20 results, we reached the end of TMDB pages
                if (page >= (data.total_pages || 1)) break;
            } catch (err) {
                console.error(`Error syncing page ${page} of ${contentType}:`, err);
                errorCount++;
            }
        }
    }

    // Insert new entries into database in batches
    let addedCount = 0;
    if (toInsert.length > 0) {
        try {
            const BATCH_SIZE = 50;
            for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
                const batch = toInsert.slice(i, i + BATCH_SIZE);
                await Movie.insertMany(batch, { ordered: false });
                addedCount += batch.length;
            }
        } catch (insertErr: any) {
            console.error('Batch insert error (some items may have succeeded):', insertErr);
            // In case of duplicate key error, count inserted docs
            if (insertErr.insertedDocs) {
                addedCount += insertErr.insertedDocs.length;
            } else if (insertErr.result?.nInserted) {
                addedCount += insertErr.result.nInserted;
            } else {
                addedCount = toInsert.length;
            }
        }
    }

    const durationMs = Date.now() - startTime;
    return {
        success: true,
        totalDiscovered,
        addedCount,
        skippedCount,
        errorCount,
        addedTitles,
        durationMs,
        message: `Successfully pulled ${addedCount} new titles from ${startYear}–${endYear} (${skippedCount} already in library, skipped).`,
    };
}
