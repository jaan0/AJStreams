import { visibleAvailability, type Availability } from '@/lib/availability';
export default function AvailabilityBadge({ movie }: { movie: { videoUrl: string; availability?: Availability } }) {
    const status = visibleAvailability(movie);
    if (status !== 'unavailable' && status !== 'issues') return null;
    return <span title={status === 'unavailable' ? 'Recent checks or an admin marked this title unavailable. You can still retry.' : 'A source has reported failures. Another server may still work.'} className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold ${status === 'unavailable' ? 'bg-red-950 text-red-200 border border-red-400/40' : 'bg-amber-950 text-amber-200 border border-amber-400/40'}`}>{status === 'unavailable' ? 'Unavailable' : 'Playback issues'}</span>;
}
