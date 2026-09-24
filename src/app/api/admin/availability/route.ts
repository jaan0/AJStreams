import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import PlaybackReport from '@/models/PlaybackReport';
import { z } from 'zod';
export const dynamic = 'force-dynamic';
async function isAdmin() { return (await getServerSession(authOptions))?.user?.role === 'admin'; }
export async function GET(req: NextRequest) {
    if (!await isAdmin()) return new NextResponse(null, { status: 403 });
    try {
        await dbConnect();
        const query = (req.nextUrl.searchParams.get('query') || '').slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const page = Math.max(0, Math.min(10000, Number(req.nextUrl.searchParams.get('page')) || 0));
        const filter = query ? { title: { $regex: query, $options: 'i' } } : {};
        const [movies, total] = await Promise.all([Movie.find(filter).select('title videoUrl availability').sort({ 'availability.checkedAt': -1, _id: 1 }).skip(Math.floor(page) * 30).limit(30).lean(), Movie.countDocuments(filter)]);
        const episodes = await PlaybackReport.aggregate([{ $match: { movie: { $in: movies.map(m => m._id) }, scope: { $ne: 'movie' }, outcome: 'failure', updatedAt: { $gt: new Date(Date.now() - 86400000) } } }, { $group: { _id: { movie: '$movie', scope: '$scope', provider: '$provider' }, reports: { $sum: 1 } } }]);
        return NextResponse.json({ movies, total, episodes }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch { return NextResponse.json({ error: 'Could not load availability' }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
    if (req.headers.get('origin') !== new URL(req.url).origin || !await isAdmin()) return new NextResponse(null, { status: 403 });
    try {
        const data = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), action: z.enum(['unavailable', 'reset']) }).safeParse(await req.json());
        if (!data.success) return new NextResponse(null, { status: 400 });
        await dbConnect(); const movie = await Movie.findById(data.data.id);
        if (!movie) return new NextResponse(null, { status: 404 });
        const now = new Date();
        if (data.data.action === 'reset') await PlaybackReport.deleteMany({ movie: movie._id });
        movie.availability = { status: data.data.action === 'reset' ? 'unknown' : 'unavailable', sourceUrl: movie.videoUrl, checkedAt: now, expiresAt: new Date(now.getTime() + 86400000), reason: data.data.action === 'reset' ? 'Admin reset' : 'Admin marked unavailable' };
        await movie.save(); revalidatePath('/');
        return NextResponse.json({ success: true });
    } catch { return NextResponse.json({ error: 'Could not change availability' }, { status: 503 }); }
}
