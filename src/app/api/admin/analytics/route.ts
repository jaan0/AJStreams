import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { analyticsPath } from '@/lib/analytics';

export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if ((session?.user as { role?: string } | undefined)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const days = Number(req.nextUrl.searchParams.get('days') || 7);
    if (![1, 7, 30, 90].includes(days)) return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
    const path = analyticsPath(req.nextUrl.searchParams.get('path') || '/');
    const device = req.nextUrl.searchParams.get('device') || 'Mobile';
    if (!['Mobile', 'Tablet', 'Desktop'].includes(device)) return NextResponse.json({ error: 'Invalid device' }, { status: 400 });
    try {
        await dbConnect();
        const since = new Date(Date.now() - days * 86400000);
        const breakdown = (field: string) => [{ $match: { type: 'pageview' } }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }, { $sort: { count: -1 as const } }, { $limit: 20 }];
        const [data] = await AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $facet: {
                totals: [{ $group: { _id: '$session', views: { $sum: { $cond: [{ $eq: ['$type', 'pageview'] }, 1, 0] } }, seconds: { $sum: { $cond: [{ $eq: ['$type', 'engagement'] }, '$seconds', 0] } }, clicks: { $sum: { $cond: [{ $eq: ['$type', 'click'] }, 1, 0] } } } }, { $group: { _id: null, sessions: { $sum: 1 }, views: { $sum: '$views' }, seconds: { $sum: '$seconds' }, clicks: { $sum: '$clicks' } } }],
                daily: [{ $match: { type: 'pageview' } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
                pages: breakdown('path'), countries: breakdown('country'), referrers: breakdown('referrer'), devices: breakdown('device'), browsers: breakdown('browser'), systems: breakdown('os'),
                cities: [{ $match: { type: 'pageview' } }, { $group: { _id: { $concat: ['$city', ', ', '$region', ', ', '$country'] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 20 }],
                paths: [{ $group: { _id: '$path' } }, { $sort: { _id: 1 } }, { $limit: 500 }],
                heat: [{ $match: { type: 'click', path, device } }, { $group: { _id: { x: { $min: [19, { $floor: { $multiply: ['$x', 20] } }] }, y: { $min: [19, { $floor: { $multiply: ['$y', 20] } }] } }, count: { $sum: 1 } } }],
                depth: [{ $match: { type: 'engagement', path, device } }, { $group: { _id: '$view', depth: { $max: '$scroll' } } }, { $group: { _id: null, average: { $avg: '$depth' }, views: { $sum: 1 } } }],
            } },
        ]).option({ maxTimeMS: 15000 });
        return NextResponse.json({ ...data, days, path, device, geoEnabled: process.env.VERCEL === '1' }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch { return NextResponse.json({ error: 'Analytics could not load. Try again.' }, { status: 503 }); }
}
