'use client';

import { Play, Star } from 'react-feather';
import type { IMovie } from '@/models/Movie';
import AvailabilityBadge from './AvailabilityBadge';

export default function MovieCard({ movie, onPlay }: { movie: IMovie; onPlay: (movie: IMovie) => void }) {
    return <button type="button" className="poster-card" onClick={() => onPlay(movie)} aria-label={`Watch ${movie.title}`}>
        <div className="poster-art"><img src={movie.posterUrl} alt="" loading="lazy" draggable={false} /><span className="poster-quality">HD</span><span className="poster-play"><Play size={23} fill="currentColor" /></span></div>
        <h3>{movie.title}</h3>
        <AvailabilityBadge movie={movie} />
        <div className="poster-meta">{movie.rating > 0 && <><span><Star size={10} fill="currentColor" />{movie.rating.toFixed(1)}</span><i /></>}<span>{movie.year}</span>{movie.genre[0] && <><i /><span>{movie.genre[0]}</span></>}</div>
    </button>;
}
