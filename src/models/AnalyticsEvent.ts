import mongoose, { Schema } from 'mongoose';
const schema = new Schema({
    eventId: { type: String, required: true, unique: true },
    session: { type: String, required: true }, view: String,
    type: String, path: String, referrer: String,
    country: String, region: String, city: String,
    device: String, browser: String, os: String,
    width: Number, height: Number, x: Number, y: Number,
    scroll: Number, seconds: Number, target: String,
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 },
});
schema.index({ createdAt: -1, type: 1 });
schema.index({ path: 1, device: 1, createdAt: -1 });
export default mongoose.models.AnalyticsEvent || mongoose.model('AnalyticsEvent', schema);
