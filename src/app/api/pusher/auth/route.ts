
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new Response('Forbidden', { status: 403 });
  }

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

  const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
  return new Response(JSON.stringify(authResponse));
}
