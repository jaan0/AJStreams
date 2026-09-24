import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import dbConnect from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { analyticsBatch, analyticsPath, referrerHost } from '@/lib/analytics';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const limiter = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(60, '1 m'), prefix: 'ajstreams:analytics' }) : null;
const buckets = new Map<string, { count: number; reset: number }>();
let retryLimiterAt = 0;
export async function POST(req: NextRequest) {
    if (req.headers.get('origin') !== new URL(req.url).origin) return new NextResponse(null, { status: 403 });
    if (req.headers.get('dnt') === '1' || req.headers.get('sec-gpc') === '1') return new NextResponse(null, { status: 204 });
    if (Number(req.headers.get('content-length')) > 20000) return new NextResponse(null, { status: 413 });
    const key = createHash('sha256').update((req.headers.get('x-forwarded-for')?.split(',')[0] || 'local') + new Date().toISOString().slice(0, 10)).digest('hex');
    // Always keep a bounded local guard, even when the shared service is down.
    {
        const now = Date.now();
        for (const [id, bucket] of buckets) if (bucket.reset <= now) buckets.delete(id);
        if (buckets.size >= 10000 && !buckets.has(key)) return new NextResponse(null, { status: 429 });
        const bucket = buckets.get(key) || { count: 0, reset: now + 60000 };
        buckets.set(key, bucket);
        if (++bucket.count > 60) return new NextResponse(null, { status: 429 });
    }
    if (limiter && Date.now() >= retryLimiterAt) {
        try {
            if (!(await limiter.limit(key)).success) return new NextResponse(null, { status: 429 });
        } catch { retryLimiterAt = Date.now() + 60000; }
    }
    try {
        const text = await req.text();
        if (text.length > 20000) return new NextResponse(null, { status: 413 });
        const parsed = analyticsBatch.safeParse(JSON.parse(text));
        if (!parsed.success) return NextResponse.json({ error: 'Invalid events' }, { status: 400 });
        const ua = req.headers.get('user-agent') || '';
        if (/bot|crawler|spider|headless/i.test(ua)) return new NextResponse(null, { status: 204 });
        const geo = (name: string) => {
            if (process.env.VERCEL !== '1') return 'Unknown';
            try { return decodeURIComponent(req.headers.get(`x-vercel-ip-${name}`) || 'Unknown').slice(0, 100); } catch { return 'Unknown'; }
        };
        const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
        const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
        const events = parsed.data.events.filter(e => !e.path.startsWith('/admin')).map(e => ({
            ...e, eventId: e.id, session: parsed.data.session, path: analyticsPath(e.path),
            referrer: referrerHost(e.referrer), country: geo('country'), region: geo('country-region'), city: geo('city'),
            device: e.width < 768 ? 'Mobile' : e.width < 1024 ? 'Tablet' : 'Desktop', browser, os,
        }));
        if (events.length) {
            await dbConnect();
            await AnalyticsEvent.bulkWrite(events.map(event => ({ updateOne: { filter: { eventId: event.eventId }, update: { $setOnInsert: event }, upsert: true } })), { ordered: false });
        }
        return new NextResponse(null, { status: 204 });
    } catch { return NextResponse.json({ error: 'Could not record events' }, { status: 400 }); }
}
