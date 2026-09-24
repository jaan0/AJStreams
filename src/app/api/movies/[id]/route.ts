import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { movieLookup } from '@/lib/movie-lookup';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const query = movieLookup(params.id);
        if (!query) return NextResponse.json({ error: 'Invalid movie ID' }, { status: 400 });
        await dbConnect();
        const movie = await Movie.findOne(query);

        if (!movie) {
            return NextResponse.json(
                { error: 'Movie not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(movie);
    } catch (error) {
        console.error('Error fetching movie:', error);
        return NextResponse.json(
            { error: 'Failed to fetch movie' },
            { status: 500 }
        );
    }
}
