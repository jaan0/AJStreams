import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'user' | 'admin';
    favorites: mongoose.Types.ObjectId[];
    watchHistory: {
        movieId: mongoose.Types.ObjectId;
        watchedAt: Date;
        progress: number; // Percentage or timestamp
    }[];
    settings: {
        autoplay: boolean;
        quality: 'auto' | 'low' | 'medium' | 'high';
    };
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, select: false }, // Don't return password by default
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        favorites: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
        watchHistory: [
            {
                movieId: { type: Schema.Types.ObjectId, ref: 'Movie' },
                watchedAt: { type: Date, default: Date.now },
                progress: { type: Number, default: 0 },
            },
        ],
        settings: {
            autoplay: { type: Boolean, default: true },
            quality: {
                type: String,
                enum: ['auto', 'low', 'medium', 'high'],
                default: 'auto',
            },
        },
    },
    { timestamps: true }
);

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
