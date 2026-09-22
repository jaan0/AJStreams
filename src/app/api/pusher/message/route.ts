import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Pusher from 'pusher';
import { NextResponse } from 'next/server';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';
import { validateRequest } from '@/lib/validate';
import { sendMessageSchema } from '@/lib/validations/chat';

import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    rateLimiters.message,
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
          'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
        },
      }
    );
  }

  // Validate request body
  const body = await req.json();
  const validation = validateRequest(sendMessageSchema, body);

  if (!validation.success) {
    return validation.error;
  }

  const { channel, message } = validation.data;

  try {
    await pusherServer.trigger(channel, 'chat-message', {
      ...message,
      user: {
        name: session.user.name,
        image: session.user.image,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
