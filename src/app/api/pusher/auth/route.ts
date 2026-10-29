import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!pusherServer) {
    return new Response(
      JSON.stringify({
        error: 'Pusher is not configured on the server. Please add Pusher credentials to .env.local',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const data = await req.text();
    const socketId = new URLSearchParams(data).get('socket_id')!;
    const channel = new URLSearchParams(data).get('channel_name')!;

    const presenceData = {
      user_id: session.user.email,
      user_info: {
        name: session.user.name,
        image: session.user.image,
      },
    };

    const authResponse = pusherServer.authorizeChannel(socketId, channel, presenceData);
    return new Response(JSON.stringify(authResponse), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Pusher auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Pusher authorization failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
