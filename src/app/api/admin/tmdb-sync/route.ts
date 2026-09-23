import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { syncTmdbContent, TmdbSyncOptions } from '@/lib/tmdb-sync';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const totalMovies = await Movie.countDocuments({});
        const recentImports = await Movie.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title year genre rating createdAt posterUrl')
            .lean();

        return NextResponse.json({
            status: 'ready',
            totalMovies,
            recentImports,
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: error?.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const options: TmdbSyncOptions = {
            types: body.types || 'both',
            startYear: body.startYear ? parseInt(body.startYear, 10) : 2023,
            endYear: body.endYear ? parseInt(body.endYear, 10) : 2026,
            maxPages: body.maxPages ? parseInt(body.maxPages, 10) : 5,
            minVoteCount: body.minVoteCount ? parseInt(body.minVoteCount, 10) : 15,
        };

        const result = await syncTmdbContent(options);

        return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } catch (error: any) {
        console.error('TMDB Sync API error:', error);
        return NextResponse.json(
            {
                success: false,
                message: error?.message || 'Sync failed due to an internal error',
            },
            { status: 500 }
        );
    }
}
