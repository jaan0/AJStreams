import dbConnect from '@/lib/mongodb';
import Movie from '@/models/Movie';
import GenreCards from '@/components/GenreCards';
import Footer from '@/components/Footer';

export const revalidate = 300;
export const metadata = { title: 'Popular Genres | AJStreams' };
export default async function GenresPage() {
    await dbConnect();
    const genres = await Movie.aggregate([
        { $unwind: '$genre' },
        { $group: { _id: '$genre', image: { $first: '$posterUrl' }, count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
    ]);
    return <><div className="library-page"><h1 className="text-center text-3xl font-bold mb-9">Popular Genres</h1><GenreCards all genres={genres.map(g => ({ name: g._id, image: g.image, count: g.count }))} /></div><Footer /></>;
}
