'use client';

import { useEffect, useState } from 'react';
import { Play, ArrowRight, ChevronLeft, ChevronRight, Pause, Star } from 'react-feather';
import type { IMovie } from '@/models/Movie';
import { extractIframeSrc } from '@/lib/embed';

interface HeroProps { movies: IMovie[]; onPlay: (movie: IMovie) => void; onMoreInfo: (movie: IMovie) => void; }

export default function Hero({ movies, onPlay, onMoreInfo }: HeroProps) {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [backdrops, setBackdrops] = useState<Record<string, string>>({});
    const slides = movies.slice(0, 6);
    const movie = slides[index % Math.max(slides.length, 1)];
    useEffect(() => {
        if (paused || hovered || slides.length < 2) return;
        const timer = setInterval(() => setIndex(value => (value + 1) % slides.length), 8000);
        return () => clearInterval(timer);
    }, [paused, hovered, slides.length]);
    useEffect(() => {
        if (!movie) return;
        const key = String(movie._id);
        if (backdrops[key]) return;
        const match = extractIframeSrc(movie.videoUrl).match(/watch\/(movie|tv)\/(\d+)/);
        if (!match) return;
        const controller = new AbortController();
        fetch(`/api/tmdb/${match[1]}/${match[2]}`, { signal: controller.signal })
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data?.backdropUrl) setBackdrops(value => ({ ...value, [key]: data.backdropUrl })); })
            .catch(() => {});
        return () => controller.abort();
    }, [movie, backdrops]);
    if (!movie) return <section className="cinema-hero hero-empty"><div className="hero-copy"><p className="eyebrow">YOUR FRONT ROW SEAT</p><h1>A world of stories.<br />One place to watch.</h1><p>Your movie library will appear here as titles are added.</p></div></section>;
    const move = (step: number) => setIndex(value => (value + step + slides.length) % slides.length);
    return <section className="cinema-hero" aria-label="Featured titles" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <img key={String(movie._id)} className="hero-backdrop" src={backdrops[String(movie._id)] || movie.posterUrl} alt="" onError={event => { if (event.currentTarget.src !== movie.posterUrl) event.currentTarget.src = movie.posterUrl; }} />
        <div className="hero-shade" />
        <div className="hero-copy">
            <p className="eyebrow"><span className="tiny-line" /> IN THE SPOTLIGHT</p>
            <h1>{movie.title}</h1>
            <div className="hero-meta">{movie.rating > 0 && <span><Star size={14} fill="currentColor" /> {movie.rating.toFixed(1)}</span>}<span>{movie.year}</span>{movie.genre.slice(0, 2).map(genre => <span key={genre}>{genre}</span>)}<span className="quality-tag">HD</span></div>
            <p className="hero-description">{movie.description}</p>
            <div className="hero-actions"><button className="hero-play" onClick={() => onPlay(movie)} aria-label={`Play ${movie.title}`}><Play size={23} fill="currentColor" /></button><button className="hero-details" onClick={() => onMoreInfo(movie)}>See more <ArrowRight size={17} /></button></div>
        </div>
        {slides.length > 1 && <div className="hero-controls"><button className="icon-button" onClick={() => move(-1)} aria-label="Previous featured title"><ChevronLeft size={19} /></button><div className="hero-thumbnails">{slides.map((slide, i) => <button key={String(slide._id)} onClick={() => setIndex(i)} className={i === index % slides.length ? 'active' : ''} aria-label={`Show ${slide.title}`} aria-pressed={i === index % slides.length}><img src={slide.posterUrl} alt="" /></button>)}</div><button className="icon-button" onClick={() => move(1)} aria-label="Next featured title"><ChevronRight size={19} /></button><button className="icon-button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'}>{paused ? <Play size={15} /> : <Pause size={15} />}</button></div>}
    </section>;
}
