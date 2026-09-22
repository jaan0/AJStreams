import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMovie extends Document {
    title: string;
    description: string;
    posterUrl: string;
    videoUrl: string;
    genre: string[];
    rating: number;
    year: number;
    featured: boolean;
    views: number;
    createdAt: Date;
    updatedAt: Date;
}

const MovieSchema: Schema<IMovie> = new Schema(
    {
        title: { type: String, required: true, index: 'text' }, // Text index for search
        description: { type: String, required: true },
        posterUrl: { type: String, required: true },
        videoUrl: { type: String, required: true },
        genre: [{ type: String }],
        rating: { type: Number, default: 0 },
        year: { type: Number, required: true },
        featured: { type: Boolean, default: false },
        views: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Movie: Model<IMovie> =
    mongoose.models.Movie || mongoose.model<IMovie>('Movie', MovieSchema);

export default Movie;
