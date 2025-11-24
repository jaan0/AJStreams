import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMovieRequest extends Document {
    movieTitle: string;
    releaseYear?: number;
    status: 'pending' | 'fulfilled' | 'rejected';
    userName: string; // Or userId if you want to link to User model
    createdAt: Date;
    updatedAt: Date;
}

const MovieRequestSchema: Schema<IMovieRequest> = new Schema(
    {
        movieTitle: { type: String, required: true },
        releaseYear: { type: Number },
        status: {
            type: String,
            enum: ['pending', 'fulfilled', 'rejected'],
            default: 'pending',
        },
        userName: { type: String, required: true },
    },
    { timestamps: true }
);

const MovieRequest: Model<IMovieRequest> =
    mongoose.models.MovieRequest ||
    mongoose.model<IMovieRequest>('MovieRequest', MovieRequestSchema);

export default MovieRequest;
