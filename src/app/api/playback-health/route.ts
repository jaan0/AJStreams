import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createHash } from 'crypto';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import PlaybackReport from '@/models/PlaybackReport';
import { movieLookup } from '@/lib/movie-lookup';
import { extractTmdbId, parseEmbedUrl } from '@/lib/embed';
import { decideAvailability, HealthReport } from '@/lib/availability';
import { revalidatePath } from 'next/cache';

const input = z.object({ id: z.string().regex(/^(?:[a-f\d]{24}|\d{1,12})$/i), provider: z.enum(['direct', 'bingr', 'vidlink', 'multiembed']), outcome: z.enum(['success', 'failure']), mediaType: z.enum(['movie', 'tv']), season: z.number().int().min(1).max(1000).optional(), episode: z.number().int().min(1).max(10000).optional() });
export async function POST(req: NextRequest) {
    if (req.headers.get('origin') !== new URL(req.url).origin) return new NextResponse(null, { status: 403 });
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return new NextResponse(null, { status: 401 });
    if (Number(req.headers.get('content-length')) > 2000) return new NextResponse(null, { status: 413 });
    try {
        const text = await req.text();
        if (text.length > 2000) return new NextResponse(null, { status: 413 });
        const parsed = input.safeParse(JSON.parse(text));
        if (!parsed.success) return new NextResponse(null, { status: 400 });
        const data = parsed.data;
        // No undocumented failure events from opaque iframe providers are accepted.
        if (data.outcome === 'failure' && !['direct', 'vidlink'].includes(data.provider)) return new NextResponse(null, { status: 400 });
        await dbConnect();
        let query: any = movieLookup(data.id);
        if (data.mediaType === 'tv' && /^\d+$/.test(data.id)) query = { videoUrl: { $regex: `^https://bingr\\.one/watch/tv/${data.id}/` } };
        const movie = await Movie.findOne(query);
        if (!movie) return new NextResponse(null, { status: 404 });
        const iframe = parseEmbedUrl(movie.videoUrl).isIframe;
        const providers = iframe && extractTmdbId(movie.videoUrl) ? ['bingr', 'vidlink', 'multiembed'] : ['direct'];
        if (!providers.includes(data.provider) || (iframe && data.provider === 'direct')) return new NextResponse(null, { status: 400 });
        const now = new Date();
        const reporter = createHash('sha256').update(`${process.env.NEXTAUTH_SECRET}:${session.user.id}`).digest('hex');
        const source = createHash('sha256').update(movie.videoUrl).digest('hex');
        const scope = data.mediaType === 'tv' ? `${data.season || 1}:${data.episode || 1}` : 'movie';
        const key = { movie: movie._id, source, scope, provider: data.provider, reporter };
        const previous = await PlaybackReport.findOne(key).lean() as any;
        // One report per viewer/provider/episode; successful recovery is allowed immediately.
        if (previous && now.getTime() - new Date(previous.updatedAt).getTime() < 60000 && !(previous.outcome === 'failure' && data.outcome === 'success')) return new NextResponse(null, { status: 204 });
        if (await PlaybackReport.countDocuments({ reporter, updatedAt: { $gt: new Date(now.getTime() - 60000) } }) >= 20) return new NextResponse(null, { status: 429 });
        await PlaybackReport.updateOne(key, { $set: { outcome: data.outcome, admin: session.user.role === 'admin', updatedAt: now } }, { upsert: true });
        // A broken episode must never mark the entire series unavailable.
        if (data.mediaType === 'movie' && !/\/watch\/tv\//.test(movie.videoUrl)) {
            const reports = await PlaybackReport.find({ movie: movie._id, source, scope, updatedAt: { $gt: new Date(now.getTime() - 86400000) } }).sort({ updatedAt: -1 }).limit(1000).lean() as unknown as HealthReport[];
            let status = decideAvailability(reports, providers, now.getTime());
            const keepManual = movie.availability?.sourceUrl === movie.videoUrl && movie.availability?.reason === 'Admin marked unavailable' && new Date(movie.availability.expiresAt).getTime() > now.getTime() && status !== 'available';
            if (keepManual) status = 'unavailable';
            await Movie.updateOne({ _id: movie._id, videoUrl: movie.videoUrl, $or: [{ 'availability.checkedAt': { $lte: now } }, { 'availability.checkedAt': { $exists: false } }] }, { $set: { availability: { status, sourceUrl: movie.videoUrl, checkedAt: now, expiresAt: keepManual ? movie.availability!.expiresAt : new Date(now.getTime() + 86400000), reason: keepManual ? 'Admin marked unavailable' : 'Automatic playback reports' } } });
            if (movie.availability?.status !== status) revalidatePath('/');
        }
        return new NextResponse(null, { status: 204 });
    } catch { return NextResponse.json({ error: 'Could not save playback report' }, { status: 503 }); }
}
