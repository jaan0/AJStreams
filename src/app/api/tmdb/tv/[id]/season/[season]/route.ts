import { NextResponse } from 'next/server';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_STILL_IMAGE = 'https://image.tmdb.org/t/p/w500';

export async function GET(
    req: Request,
    { params }: { params: { id: string; season: string } }
) {
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey || apiKey === 'your-tmdb-api-key-here') {
        return NextResponse.json(
            { error: 'TMDB_API_KEY is not configured in .env.local' },
            { status: 500 }
        );
    }

    const { id, season } = params;

    try {
        const res = await fetch(
            `${TMDB_BASE}/tv/${id}/season/${season}?api_key=${apiKey}&language=en-US`
        );

        if (!res.ok) {
            const err = await res.json();
            return NextResponse.json(
                { error: err.status_message || 'Failed to fetch season data from TMDB' },
                { status: res.status }
            );
        }

        const data = await res.json();

        const episodes = (data.episodes || []).map((ep: any) => ({
            id: ep.id,
            episodeNumber: ep.episode_number,
            name: ep.name || `Episode ${ep.episode_number}`,
            overview: ep.overview || '',
            runtime: ep.runtime || null,
            stillUrl: ep.still_path ? `${TMDB_STILL_IMAGE}${ep.still_path}` : null,
            airDate: ep.air_date || '',
            rating: ep.vote_average ? Math.round(ep.vote_average * 10) / 10 : null,
        }));

        return NextResponse.json({
            tmdbId: id,
            seasonNumber: parseInt(season, 10),
            name: data.name || `Season ${season}`,
            overview: data.overview || '',
            episodes,
        });
    } catch (error: any) {
        console.error('TMDB season fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error while fetching season' },
            { status: 500 }
        );
    }
}
