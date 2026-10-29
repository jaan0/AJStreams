import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { isPusherConfigured } from '@/lib/pusher';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        let dbOk = false;
        try {
            await connectDB();
            dbOk = true;
        } catch {
            dbOk = false;
        }

        const session = await getServerSession(authOptions);

        return NextResponse.json({
            enabled: dbOk,
            pusherConfigured: isPusherConfigured,
            pusherKey: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || null,
            pusherCluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || 'mt1',
            mongodbConnected: dbOk,
            user: session?.user
                ? {
                    id: (session.user as any).id,
                    name: session.user.name,
                    email: session.user.email,
                }
                : null,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}
