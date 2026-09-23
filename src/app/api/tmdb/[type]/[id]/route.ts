import { NextResponse } from 'next/server';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/w500';

export async function GET(
    req: Request,
    { params }: { params: { type: string; id: string } }
) {
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey || apiKey === 'your-tmdb-api-key-here') {
        return NextResponse.json(
            { error: 'TMDB_API_KEY is not configured in .env.local' },
            { status: 500 }
        );
    }

    const { type, id } = params;

    // type: 'movie' | 'tv' | 'anime' (anime uses tv endpoint on TMDB)
    const endpoint = type === 'movie' ? 'movie' : 'tv';

    try {
        const [detailsRes, creditsRes] = await Promise.all([
            fetch(`${TMDB_BASE}/${endpoint}/${id}?api_key=${apiKey}&language=en-US`),
            fetch(`${TMDB_BASE}/${endpoint}/${id}/credits?api_key=${apiKey}&language=en-US`),
        ]);

        if (!detailsRes.ok) {
            const err = await detailsRes.json();
            return NextResponse.json(
                { error: err.status_message || 'TMDB fetch failed' },
                { status: detailsRes.status }
            );
        }

        const details = await detailsRes.json();
        const credits = creditsRes.ok ? await creditsRes.json() : null;

        // Normalize movie vs tv shape
        const title = details.title || details.name || '';
        const overview = details.overview || '';
        const year = new Date(
            details.release_date || details.first_air_date || ''
        ).getFullYear();
        const posterUrl = details.poster_path
            ? `${TMDB_IMAGE}${details.poster_path}`
            : '';
        const backdropUrl = details.backdrop_path
            ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
            : '';
        const genres = (details.genres || []).map((g: any) => g.name);
        const rating = details.vote_average || 0;
        const cast = credits
            ? (credits.cast || []).slice(0, 5).map((c: any) => c.name)
            : [];

        return NextResponse.json({
            tmdbId: id,
            type: endpoint,
            title,
            overview,
            year: isNaN(year) ? new Date().getFullYear() : year,
            posterUrl,
            backdropUrl,
            genres,
            rating: Math.round(rating * 10) / 10,
            cast,
            runtime: details.runtime || details.episode_run_time?.[0] || null,
            status: details.status || '',
            tagline: details.tagline || '',
            numberOfSeasons: details.number_of_seasons || null,
            numberOfEpisodes: details.number_of_episodes || null,
            seasons: (details.seasons || [])
                .filter((s: any) => s.season_number > 0)
                .map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    seasonNumber: s.season_number,
                    episodeCount: s.episode_count,
                    posterUrl: s.poster_path ? `${TMDB_IMAGE}${s.poster_path}` : null,
                    airDate: s.air_date,
                })),
            // Bingr embed URL generated from TMDB ID
            bingrMovieUrl: endpoint === 'movie'
                ? `https://bingr.one/watch/movie/${id}`
                : `https://bingr.one/watch/tv/${id}/1/1`,
        });
    } catch (error: any) {
        console.error('TMDB fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch from TMDB' },
            { status: 500 }
        );
    }
}
