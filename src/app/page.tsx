import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Movie, { IMovie } from '@/models/Movie';
import MovieSection from '@/components/MovieSection';
import VideoPlayer from '@/components/VideoPlayer';
import Hero from '@/components/Hero';
import ClientHome from './ClientHome';

async function getMovies() {
    await dbConnect();
    const movies = await Movie.find({}).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(movies));
}

export default async function Home() {
    const movies = await getMovies();
    const featuredMovies = movies.filter((m: any) => m.featured);
    if (featuredMovies.length === 0 && movies.length > 0) {
        featuredMovies.push(movies[0]);
    }

    // Group by genre with deduplication
    const genres = [...new Set(movies.flatMap((m: any) => m.genre as string[]))] as string[];
    const usedMovieIds = new Set<string>();

    if (featuredMovies.length > 0) {
        featuredMovies.forEach((movie: any) => {
            usedMovieIds.add(movie._id.toString());
        });
    }

    const moviesByGenre = genres
        .map((genre) => {
            const genreMovies = movies.filter(
                (m: any) =>
                    m.genre.includes(genre) && !usedMovieIds.has(m._id.toString())
            );

            // Mark these movies as used
            genreMovies.forEach((m: any) => usedMovieIds.add(m._id.toString()));

            return {
                genre,
                movies: genreMovies,
            };
        })
        .filter((section) => section.movies.length > 0);

    return (
        <ClientHome
            featuredMovies={featuredMovies}
            moviesByGenre={moviesByGenre}
            allMovies={movies}
        />
    );
}
