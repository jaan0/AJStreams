import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Movie from '@/models/Movie';
import User from '@/models/User';

// Simple AI-based recommendation algorithm
async function getRecommendations(userId?: string) {
    await connectDB();

    if (userId) {
        // Get user's favorite movies
        const user = await User.findById(userId).populate('favorites');

        if (user && user.favorites && user.favorites.length > 0) {
            // Extract genres from user's favorites
            const favoriteGenres = new Set<string>();
            user.favorites.forEach((movie: any) => {
                movie.genre?.forEach((g: string) => favoriteGenres.add(g));
            });

            // Get movies matching those genres (excluding already favorited)
            const favoritedIds = user.favorites.map((m: any) => m._id.toString());
            const recommendations = await Movie.find({
                genre: { $in: Array.from(favoriteGenres) },
                _id: { $nin: favoritedIds }
            })
                .limit(20)
                .sort({ year: -1 });

            return recommendations;
        }
    }

    // Fallback: Return trending/popular movies (newest + highest rated)
    const trending = await Movie.find({})
        .sort({ year: -1, createdAt: -1 })
        .limit(20);

    return trending;
}

// GET - Get AI recommendations
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        const recommendations = await getRecommendations(userId);

        return NextResponse.json({
            recommendations,
            personalized: !!userId,
            message: userId
                ? 'Recommendations based on your favorites'
                : 'Trending movies for you'
        });
    } catch (error) {
        console.error('Failed to get recommendations:', error);
        return NextResponse.json(
            { error: 'Failed to get recommendations' },
            { status: 500 }
        );
    }
}
