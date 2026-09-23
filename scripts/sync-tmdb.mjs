#!/usr/bin/env node
/**
 * AJStreams TMDB Automatic Sync Script
 * 
 * Usage:
 *   node scripts/sync-tmdb.mjs             (runs once immediately)
 *   node scripts/sync-tmdb.mjs --loop      (runs every 12 hours indefinitely)
 *   node scripts/sync-tmdb.mjs --pages 10  (fetches up to 10 pages per type)
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.slice(1, -1);
            }
            if (!process.env[key]) {
                process.env[key] = val;
            }
        }
    }
}

const MONGODB_URI = process.env.MONGODB_URI;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment or .env.local');
    process.exit(1);
}

if (!TMDB_API_KEY || TMDB_API_KEY === 'your-tmdb-api-key-here') {
    console.error('❌ TMDB_API_KEY not configured in .env.local');
    process.exit(1);
}

// Minimal Movie Schema definition for script
const MovieSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        posterUrl: { type: String, required: true },
        videoUrl: { type: String, required: true },
        genre: [{ type: String }],
        rating: { type: Number, default: 0 },
        year: { type: Number, required: true },
        featured: { type: Boolean, default: false },
        views: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Movie = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);

function extractTmdbId(url) {
    if (!url) return null;
    if (/^\d+$/.test(url.trim())) return url.trim();
    const movieMatch = url.match(/watch\/movie\/(\d+)/i);
    if (movieMatch) return movieMatch[1];
    const tvMatch = url.match(/watch\/tv\/(\d+)/i);
    if (tvMatch) return tvMatch[1];
    const vidlinkMatch = url.match(/vidlink\.pro\/(?:movie|tv)\/(\d+)/i);
    if (vidlinkMatch) return vidlinkMatch[1];
    const multiMatch = url.match(/video_id=(\d+)/i);
    if (multiMatch) return multiMatch[1];
    return null;
}

const GENRE_MAP = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
    10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
    10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

async function runSync(options = {}) {
    const {
        startYear = 2023,
        endYear = 2026,
        maxPages = 5,
        minVoteCount = 15,
    } = options;

    console.log(`\n========================================================`);
    console.log(`🎬 AJStreams TMDB Sync Started: ${new Date().toLocaleString()}`);
    console.log(`🎯 Year Range: ${startYear} - ${endYear} | Max Pages: ${maxPages}`);
    console.log(`========================================================`);

    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    }

    const existingDocs = await Movie.find({}, { videoUrl: 1, title: 1, year: 1 }).lean();
    const existingTmdbIds = new Set();
    const existingTitleKeys = new Set();

    for (const d of existingDocs) {
        const id = extractTmdbId(d.videoUrl);
        if (id) existingTmdbIds.add(id);
        if (d.title && d.year) existingTitleKeys.add(`${d.title.toLowerCase().trim()}_${d.year}`);
    }

    console.log(`📊 Found ${existingDocs.length} existing titles in database (${existingTmdbIds.size} identified TMDB IDs)`);

    const types = ['movie', 'tv'];
    let totalDiscovered = 0;
    let addedCount = 0;
    let skippedCount = 0;
    const toInsert = [];

    for (const type of types) {
        console.log(`\n🔍 Searching TMDB for ${type === 'movie' ? 'Movies' : 'TV Series'} (${startYear}-${endYear})...`);

        for (let page = 1; page <= maxPages; page++) {
            let url = '';
            if (type === 'movie') {
                url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=${page}&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31&vote_count.gte=${minVoteCount}`;
            } else {
                url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_null_first_air_dates=false&page=${page}&first_air_date.gte=${startYear}-01-01&first_air_date.lte=${endYear}-12-31&vote_count.gte=${minVoteCount}`;
            }

            try {
                const res = await fetch(url);
                if (!res.ok) {
                    console.warn(`  ⚠️ TMDB returned status ${res.status} on page ${page}`);
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

                    if (!title || !item.poster_path || year < startYear || year > endYear) {
                        skippedCount++;
                        continue;
                    }

                    const titleKey = `${title.toLowerCase()}_${year}`;
                    if (existingTmdbIds.has(idStr) || existingTitleKeys.has(titleKey)) {
                        skippedCount++;
                        continue;
                    }

                    const genres = (item.genre_ids || []).map(g => GENRE_MAP[g]).filter(Boolean);
                    if (genres.length === 0) genres.push(type === 'tv' ? 'TV Show' : 'Movie');

                    const rating = Math.round((item.vote_average || 0) * 10) / 10;
                    const posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
                    const videoUrl = type === 'tv'
                        ? `https://bingr.one/watch/tv/${idStr}/1/1`
                        : `https://bingr.one/watch/movie/${idStr}`;

                    toInsert.push({
                        title,
                        description: item.overview || `Watch ${title} online in HD on AJStreams.`,
                        posterUrl,
                        videoUrl,
                        genre: genres,
                        rating,
                        year,
                        featured: false,
                        views: 0
                    });

                    existingTmdbIds.add(idStr);
                    existingTitleKeys.add(titleKey);
                    console.log(`  ➕ Staged: ${title} (${year}) [${type.toUpperCase()}] ⭐ ${rating}`);
                }

                if (page >= (data.total_pages || 1)) break;
            } catch (err) {
                console.error(`  ❌ Error fetching page ${page}:`, err.message);
            }
        }
    }

    if (toInsert.length > 0) {
        console.log(`\n💾 Inserting ${toInsert.length} new titles into MongoDB...`);
        try {
            const BATCH_SIZE = 50;
            for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
                const batch = toInsert.slice(i, i + BATCH_SIZE);
                await Movie.insertMany(batch, { ordered: false });
                addedCount += batch.length;
            }
            console.log(`🎉 Successfully inserted ${addedCount} new movies/shows into database!`);
        } catch (err) {
            console.error('⚠️ Partial insert error:', err.message);
            addedCount = toInsert.length;
        }
    } else {
        console.log(`\n✨ Database is completely up-to-date! No new titles needed.`);
    }

    console.log(`\n📊 Sync Summary:`);
    console.log(`   - Discovered: ${totalDiscovered}`);
    console.log(`   - Added:      ${addedCount}`);
    console.log(`   - Skipped:    ${skippedCount} (already in DB or out of range)`);
    console.log(`========================================================\n`);
}

// Command line arguments parsing
const args = process.argv.slice(2);
const isLoop = args.includes('--loop') || args.includes('-l');
let pagesArg = 5;
const pagesIdx = args.findIndex(a => a === '--pages' || a === '-p');
if (pagesIdx !== -1 && args[pagesIdx + 1]) {
    pagesArg = parseInt(args[pagesIdx + 1], 10) || 5;
}

if (isLoop) {
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    console.log(`⏰ 12-Hour Sync Daemon Started. Next sync in 12 hours after initial run.`);
    runSync({ maxPages: pagesArg })
        .then(() => {
            setInterval(() => {
                runSync({ maxPages: pagesArg }).catch(err => console.error('Loop sync error:', err));
            }, TWELVE_HOURS_MS);
        })
        .catch(err => console.error('Initial sync error:', err));
} else {
    runSync({ maxPages: pagesArg })
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Sync failed:', err);
            process.exit(1);
        });
}
