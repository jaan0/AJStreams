import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWatchParty extends Document {
    host: mongoose.Types.ObjectId;
    movieId: string;
    movieTitle: string;
    partyName: string;
    isPrivate: boolean;
    password?: string;
    shareCode: string;
    participants: mongoose.Types.ObjectId[];
    isActive: boolean;
    isPlaying: boolean;
    currentTime: number;
    createdAt: Date;
    updatedAt: Date;
}

const WatchPartySchema: Schema<IWatchParty> = new Schema(
    {
        host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        movieId: { type: String, required: true },
        movieTitle: { type: String, required: true },
        partyName: { type: String, required: true },
        isPrivate: { type: Boolean, default: false },
        password: { type: String },
        shareCode: { type: String, required: true, unique: true },
        participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        isActive: { type: Boolean, default: true },
        isPlaying: { type: Boolean, default: false },
        currentTime: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const WatchParty: Model<IWatchParty> = mongoose.models.WatchParty || mongoose.model<IWatchParty>('WatchParty', WatchPartySchema);

export default WatchParty;
