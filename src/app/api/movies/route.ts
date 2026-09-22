import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const movies = await Movie.find({}).sort({ createdAt: -1 });
        return NextResponse.json(movies, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await req.json();

        const movie = await Movie.create(data);

        return NextResponse.json(movie, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const data = await req.json();
        const { _id, ...updateData } = data;

        if (!_id) {
            return NextResponse.json({ message: 'Movie ID required' }, { status: 400 });
        }

        const movie = await Movie.findByIdAndUpdate(_id, updateData, { new: true });

        return NextResponse.json(movie, { status: 200 });
    } catch (error) {
        console.error('Error updating movie:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
