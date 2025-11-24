import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import MovieRequest from '@/models/MovieRequest';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const requests = await MovieRequest.find().sort({ createdAt: -1 });

        return NextResponse.json(requests, { status: 200 });
    } catch (error) {
        console.error('Error fetching movie requests:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        const { title, releaseYear, name, email } = await req.json();

        if (!title) {
            return NextResponse.json(
                { error: 'Movie title is required' },
                { status: 400 }
            );
        }

        const userName = name || session?.user?.name || 'Anonymous';
        const userEmail = email || session?.user?.email || 'No Email Provided';

        const request = await MovieRequest.create({
            movieTitle: title,
            releaseYear,
            userName,
            userEmail,
            status: 'pending',
        });

        return NextResponse.json(request, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to submit request' },
            { status: 500 }
        );
    }
}
