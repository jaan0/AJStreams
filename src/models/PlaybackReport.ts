import mongoose, { Schema } from 'mongoose';
const schema = new Schema({
    movie: { type: Schema.Types.ObjectId, required: true }, source: String, scope: String,
    provider: String, reporter: String, outcome: String, admin: Boolean,
    updatedAt: { type: Date, default: Date.now, expires: 86400 },
});
schema.index({ movie: 1, source: 1, scope: 1, provider: 1, reporter: 1 }, { unique: true });
export default mongoose.models.PlaybackReport || mongoose.model('PlaybackReport', schema);
