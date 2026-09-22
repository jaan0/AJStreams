import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findById((session.user as any).id).populate(
            'favorites'
        );

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user.favorites, { status: 200 });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { movieId } = await req.json();

        if (!movieId) {
            return NextResponse.json(
                { message: 'Movie ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const userId = (session.user as any).id;

        // Use $addToSet to prevent duplicates
        await User.findByIdAndUpdate(userId, {
            $addToSet: { favorites: movieId }
        });

        return NextResponse.json(
            { message: 'Added to favorites' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error adding favorite:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const movieId = searchParams.get('movieId');

        if (!movieId) {
            return NextResponse.json(
                { message: 'Movie ID is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const userId = (session.user as any).id;
        await User.findByIdAndUpdate(userId, {
            $pull: { favorites: movieId }
        });

        return NextResponse.json(
            { message: 'Removed from favorites' },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error removing favorite:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
