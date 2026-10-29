import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';
import { validateRequest } from '@/lib/validate';
import { sendMessageSchema } from '@/lib/validations/chat';
import { pusherServer, isPusherConfigured } from '@/lib/pusher';

export interface ChatMessageItem {
  id: string;
  sender: string;
  senderId: string;
  text: string;
  timestamp: number;
  user?: {
    name: string;
    image?: string;
  };
}

// In-memory chat message buffer per party (stores last 100 messages per room)
declare global {
  var partyChatMessages: Map<string, ChatMessageItem[]> | undefined;
}

const chatStore = global.partyChatMessages || (global.partyChatMessages = new Map<string, ChatMessageItem[]>());

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get('partyId');
    const since = parseInt(searchParams.get('since') || '0', 10);

    if (!partyId) {
      return NextResponse.json({ error: 'Party ID is required' }, { status: 400 });
    }

    const channelKey = partyId.startsWith('private-watch-party-') ? partyId : `private-watch-party-${partyId}`;
    const roomMessages = chatStore.get(channelKey) || [];

    const filtered = since > 0
      ? roomMessages.filter((m) => m.timestamp > since)
      : roomMessages;

    return NextResponse.json({
      messages: filtered,
      pusherActive: isPusherConfigured,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Please sign in to send messages' }, { status: 401 });
  }

  const userId = (session.user as any).id || session.user.email || 'anonymous';
  const userName = session.user.name || session.user.email?.split('@')[0] || 'Guest';

  // Rate limiting
  const rateLimitResult = await checkRateLimit(
    rateLimiters.message,
    userId
  );

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: 'You are sending messages too quickly. Please wait a moment.',
        retryAfter: rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000) : 10,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit?.toString() || '60',
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

  const chatItem: ChatMessageItem = {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    sender: userName,
    senderId: userId,
    text: message.text,
    timestamp: Date.now(),
    user: {
      name: userName,
      image: session.user.image || undefined,
    },
  };

  // Buffer message in party store
  const existing = chatStore.get(channel) || [];
  existing.push(chatItem);
  if (existing.length > 100) existing.shift();
  chatStore.set(channel, existing);

  // Broadcast via Pusher if available
  if (pusherServer) {
    try {
      await pusherServer.trigger(channel, 'chat-message', {
        ...message,
        id: chatItem.id,
        timestamp: chatItem.timestamp,
        user: {
          name: userName,
          image: session.user.image,
          id: userId,
        },
      });
    } catch (error) {
      console.warn('Pusher broadcast failed, message stored in memory buffer:', error);
    }
  }

  return NextResponse.json({
    success: true,
    message: chatItem,
    pusherActive: isPusherConfigured,
  });
}
