import Pusher from 'pusher';

const hasPusherCredentials = Boolean(
    process.env.PUSHER_APP_ID &&
    (process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY) &&
    process.env.PUSHER_SECRET
);

export const pusherServer: Pusher | null = hasPusherCredentials
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID!,
        key: (process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY)!,
        secret: process.env.PUSHER_SECRET!,
        cluster: (process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1')!,
        useTLS: true,
    })
    : null;

export const isPusherConfigured = Boolean(pusherServer);
