import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Pusher from 'pusher';
import { NextResponse } from 'next/server';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';
import { validateRequest } from '@/lib/validate';
import { partyEndSchema } from '@/lib/validations/video-sync';

import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(
        rateLimiters.partyEnd,
        session.user.email
    );

    if (!rateLimitResult.success) {
        return NextResponse.json(
            {
                error: 'Too many requests',
                retryAfter: rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000) : 60,
            },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '3',
                    'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
                },
            }
        );
    }

    // Validate request body
    const body = await req.json();
    const validation = validateRequest(partyEndSchema, body);

    if (!validation.success) {
        return validation.error;
    }

    const { partyId } = validation.data;
    const channelName = `private-watch-party-${partyId}`;

    try {
        await pusherServer.trigger(channelName, 'party-ended', {
            message: 'The host has ended this watch party',
            timestamp: Date.now(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to broadcast party end:', error);
        return NextResponse.json({ error: 'Failed to end party' }, { status: 500 });
    }
}
