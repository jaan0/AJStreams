export type Availability = { status: 'unknown' | 'available' | 'issues' | 'unavailable'; sourceUrl: string; checkedAt: string | Date; expiresAt: string | Date; reason: string };
export type HealthReport = { provider: string; outcome: string; reporter: string; admin?: boolean; updatedAt: Date };
export function visibleAvailability(movie: { videoUrl: string; availability?: Availability }, now = Date.now()) {
    const health = movie.availability;
    return health && health.sourceUrl === movie.videoUrl && new Date(health.expiresAt).getTime() > now ? health.status : 'unknown';
}
export function decideAvailability(reports: HealthReport[], providers: string[], now = Date.now()) {
    const recent = reports.filter(r => new Date(r.updatedAt).getTime() > now - 86400000 && providers.includes(r.provider));
    // A recent successful playback outweighs failures caused by a viewer's device/network.
    if (recent.some(r => r.outcome === 'success' && new Date(r.updatedAt).getTime() > now - 3600000)) return 'available';
    const failed = providers.filter(provider => {
        const errors = recent.filter(r => r.provider === provider && r.outcome === 'failure');
        return errors.some(r => r.admin) || new Set(errors.map(r => r.reporter)).size >= 3;
    });
    return failed.length === providers.length ? 'unavailable' : failed.length ? 'issues' : 'unknown';
}
