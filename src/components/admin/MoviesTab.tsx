'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Trash2, Edit2, Upload, X, Film, Calendar,
    Link as LinkIcon, Check, Loader, PlayCircle, Search, Star, Clock
} from 'react-feather';
import { IMovie } from '@/models/Movie';
import { motion, AnimatePresence } from 'framer-motion';
import { parseEmbedUrl, createBingrMovieUrl, createBingrTvUrl, createBingrAnimeUrl, createBingrAnimeMalUrl } from '@/lib/embed';

interface TmdbResult {
    tmdbId: string;
    type: string;
    title: string;
    overview: string;
    year: number;
    posterUrl: string;
    backdropUrl: string;
    genres: string[];
    rating: number;
    cast: string[];
    runtime: number | null;
    tagline: string;
    bingrMovieUrl: string;
    numberOfSeasons?: number | null;
    numberOfEpisodes?: number | null;
}

export default function MoviesTab() {
    const [movies, setMovies] = useState<IMovie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMovie, setEditingMovie] = useState<IMovie | null>(null);
    const [uploadingPoster, setUploadingPoster] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    // TMDB Auto-fetch state
    const [tmdbFetchId, setTmdbFetchId] = useState('');
    const [tmdbFetchType, setTmdbFetchType] = useState<'movie' | 'tv'>('movie');
    const [isFetching, setIsFetching] = useState(false);
    const [fetchError, setFetchError] = useState('');
    const [fetchedResult, setFetchedResult] = useState<TmdbResult | null>(null);

    // Bingr Quick Builder State (for manual override)
    const [bingrType, setBingrType] = useState<'movie' | 'tv' | 'anime' | 'anime-mal'>('movie');
    const [season, setSeason] = useState('1');
    const [episode, setEpisode] = useState('1');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        posterUrl: '',
        videoUrl: '',
        genre: '',
        year: new Date().getFullYear(),
        featured: false,
    });

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        try {
            const res = await fetch('/api/movies');
            const data = await res.json();
            setMovies(data);
        } catch (error) {
            console.error('Failed to fetch movies', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ─── TMDB Auto-Fetch ─────────────────────────────────────────────────────
    const handleTmdbFetch = async () => {
        if (!tmdbFetchId.trim()) return;
        setIsFetching(true);
        setFetchError('');
        setFetchedResult(null);

        try {
            const res = await fetch(`/api/tmdb/${tmdbFetchType}/${tmdbFetchId.trim()}`);
            const data = await res.json();

            if (!res.ok) {
                setFetchError(data.error || 'Failed to fetch from TMDB');
                return;
            }

            setFetchedResult(data);

            // Auto-fill the form
            setFormData(prev => ({
                ...prev,
                title: data.title,
                description: data.overview,
                posterUrl: data.posterUrl,
                year: data.year,
                genre: data.genres.join(', '),
                videoUrl: data.bingrMovieUrl,
            }));
        } catch (err) {
            setFetchError('Network error. Check your TMDB_API_KEY in .env.local');
        } finally {
            setIsFetching(false);
        }
    };

    // ─── File Upload ─────────────────────────────────────────────────────────
    const handleFileUpload = async (file: File, type: 'image' | 'video') => {
        if (type === 'image') setUploadingPoster(true);
        else setUploadingVideo(true);

        try {
            const signRes = await fetch('/api/cloudinary/sign', { method: 'POST' });
            if (!signRes.ok) throw new Error('Failed to sign request');
            const { signature, timestamp } = await signRes.json();

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
            if (!cloudName || !apiKey) throw new Error('Cloudinary config missing');

            const fd = new FormData();
            fd.append('file', file);
            fd.append('api_key', apiKey);
            fd.append('timestamp', timestamp.toString());
            fd.append('signature', signature);

            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`,
                { method: 'POST', body: fd }
            );

            if (!uploadRes.ok) throw new Error('Upload failed');
            const data = await uploadRes.json();
            return data.secure_url;
        } catch (error: any) {
            alert(`Upload failed: ${error.message}`);
            return null;
        } finally {
            if (type === 'image') setUploadingPoster(false);
            else setUploadingVideo(false);
        }
    };

    const applyBingrPattern = () => {
        if (!tmdbFetchId.trim()) return;
        let url = '';
        const id = tmdbFetchId.trim();
        if (bingrType === 'movie') url = createBingrMovieUrl(id);
        else if (bingrType === 'tv') url = createBingrTvUrl(id, season || 1, episode || 1);
        else if (bingrType === 'anime') url = createBingrAnimeUrl(id, episode || 1);
        else if (bingrType === 'anime-mal') url = createBingrAnimeMalUrl(id, episode || 1);
        setFormData(prev => ({ ...prev, videoUrl: url }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingMovie ? 'PUT' : 'POST';
            const parsed = parseEmbedUrl(formData.videoUrl);
            const body = {
                ...formData,
                videoUrl: parsed.embedUrl || formData.videoUrl,
                genre: formData.genre.split(',').map(g => g.trim()).filter(Boolean),
                _id: editingMovie?._id,
            };

            const res = await fetch('/api/movies', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                fetchMovies();
                setShowAddForm(false);
                setEditingMovie(null);
                resetForm();
            }
        } catch (error) {
            console.error('Failed to save movie', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this movie?')) return;
        try {
            const res = await fetch('/api/movies', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: id }),
            });
            if (res.ok) fetchMovies();
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', description: '', posterUrl: '', videoUrl: '', genre: '', year: new Date().getFullYear(), featured: false });
        setTmdbFetchId('');
        setFetchedResult(null);
        setFetchError('');
        setSeason('1');
        setEpisode('1');
    };

    const handleEdit = (movie: IMovie) => {
        setEditingMovie(movie);
        setFormData({
            title: movie.title,
            description: movie.description,
            posterUrl: movie.posterUrl,
            videoUrl: movie.videoUrl,
            genre: movie.genre.join(', '),
            year: movie.year,
            featured: movie.featured,
        });
        setShowAddForm(true);
    };

    const parsedEmbed = parseEmbedUrl(formData.videoUrl);

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">Movie & Stream Library</h2>
                    <p className="text-xs text-zinc-400 mt-1">
                        Auto-fetch from TMDB · Accepts Bingr embeds, iframe snippets, or MP4 links
                    </p>
                </div>
                <button
                    onClick={() => { setEditingMovie(null); resetForm(); setShowAddForm(true); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-brand-purple to-brand-pink text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/25"
                >
                    <Plus size={20} />
                    Add Movie
                </button>
            </div>

            {/* Add / Edit Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                            {/* Form title row */}
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">
                                    {editingMovie ? 'Edit Movie' : 'Add New Movie'}
                                </h3>
                                <button onClick={() => { setShowAddForm(false); resetForm(); }} className="text-zinc-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* ── TMDB Auto-Fetch Block ─────────────────────── */}
                            <div className="p-4 bg-blue-950/30 border border-blue-500/20 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                                    <Search size={14} />
                                    Auto-Fetch from TMDB
                                    <span className="ml-auto text-zinc-500 font-normal normal-case">Requires TMDB_API_KEY in .env.local</span>
                                </div>

                                <div className="flex flex-wrap gap-2 items-center">
                                    {/* Movie / TV toggle */}
                                    <div className="flex rounded-xl overflow-hidden border border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setTmdbFetchType('movie')}
                                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${tmdbFetchType === 'movie' ? 'bg-blue-600 text-white' : 'bg-black/40 text-zinc-400'}`}
                                        >
                                            Movie
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTmdbFetchType('tv')}
                                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${tmdbFetchType === 'tv' ? 'bg-blue-600 text-white' : 'bg-black/40 text-zinc-400'}`}
                                        >
                                            TV Series
                                        </button>
                                    </div>

                                    {/* ID input */}
                                    <input
                                        type="text"
                                        placeholder={`TMDB ${tmdbFetchType === 'movie' ? 'Movie' : 'TV Show'} ID (e.g. ${tmdbFetchType === 'movie' ? '1007757' : '76479'})`}
                                        value={tmdbFetchId}
                                        onChange={e => setTmdbFetchId(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleTmdbFetch()}
                                        className="flex-1 min-w-[180px] bg-black/50 border border-blue-500/30 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400"
                                    />

                                    {/* Fetch button */}
                                    <button
                                        type="button"
                                        onClick={handleTmdbFetch}
                                        disabled={isFetching || !tmdbFetchId.trim()}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                                    >
                                        {isFetching ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
                                        {isFetching ? 'Fetching…' : 'Fetch & Fill'}
                                    </button>
                                </div>

                                {/* Error */}
                                {fetchError && (
                                    <p className="text-red-400 text-xs font-medium">{fetchError}</p>
                                )}

                                {/* Fetched preview card */}
                                {fetchedResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-4 p-3 bg-black/40 rounded-xl border border-blue-500/20"
                                    >
                                        {fetchedResult.posterUrl && (
                                            <img
                                                src={fetchedResult.posterUrl}
                                                alt={fetchedResult.title}
                                                className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-white font-bold text-sm truncate">{fetchedResult.title}</p>
                                            <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                                                <span className="flex items-center gap-1"><Calendar size={10} /> {fetchedResult.year}</span>
                                                <span className="flex items-center gap-1"><Star size={10} /> {fetchedResult.rating}/10</span>
                                                {fetchedResult.numberOfSeasons && (
                                                    <span className="text-purple-400 font-semibold">{fetchedResult.numberOfSeasons} Seasons ({fetchedResult.numberOfEpisodes || '?'} eps)</span>
                                                )}
                                                {fetchedResult.runtime && (
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {fetchedResult.runtime}m</span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {fetchedResult.genres.slice(0, 4).map(g => (
                                                    <span key={g} className="px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 text-[10px] font-semibold">{g}</span>
                                                ))}
                                            </div>
                                            {fetchedResult.tagline && (
                                                <p className="text-zinc-500 text-xs italic truncate">"{fetchedResult.tagline}"</p>
                                            )}
                                            <p className="text-xs text-green-400 font-mono truncate">{fetchedResult.bingrMovieUrl}</p>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-500/30">
                                                ✓ Auto-filled
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* ── Main Form ──────────────────────────────────── */}
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Title */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Title</label>
                                        <div className="relative">
                                            <Film size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="Movie title"
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-brand-purple/50"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Year */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Year</label>
                                        <div className="relative">
                                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="number"
                                                value={formData.year}
                                                onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-brand-purple/50"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Poster URL */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Poster Image URL</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="text"
                                                placeholder="https://... or auto-filled from TMDB"
                                                value={formData.posterUrl}
                                                onChange={e => setFormData({ ...formData, posterUrl: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm focus:outline-none focus:border-brand-purple/50"
                                                required
                                            />
                                        </div>
                                        <label className={`cursor-pointer ${uploadingPoster ? 'bg-brand-purple' : 'bg-white/5 hover:bg-white/10'} text-white px-4 rounded-xl border border-white/10 flex items-center justify-center transition-colors min-w-[90px] text-xs font-semibold`}>
                                            {uploadingPoster ? <><Loader className="animate-spin mr-1" size={14} />Uploading</> : formData.posterUrl ? <><Check className="mr-1 text-green-500" size={14} />Uploaded</> : <><Upload size={14} className="mr-1" />Upload</>}
                                            <input type="file" className="hidden" accept="image/*" disabled={uploadingPoster} onChange={async e => {
                                                const file = e.target.files?.[0];
                                                if (file) { const url = await handleFileUpload(file, 'image'); if (url) setFormData(p => ({ ...p, posterUrl: url })); }
                                            }} />
                                        </label>
                                    </div>
                                    {formData.posterUrl && (
                                        <img src={formData.posterUrl} alt="preview" className="w-24 h-36 object-cover rounded-xl border border-white/10 mt-2" onError={e => { e.currentTarget.src = 'https://via.placeholder.com/96x144?text=Invalid'; }} />
                                    )}
                                </div>

                                {/* ── Bingr Embed Builder ─────────────────────── */}
                                <div className="p-4 bg-purple-950/30 border border-purple-500/20 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-wider">
                                        <PlayCircle size={14} />
                                        Bingr Embed Builder
                                        <span className="ml-auto text-zinc-500 font-normal normal-case">For series, anime, or custom season/episode</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {(['movie', 'tv', 'anime', 'anime-mal'] as const).map(t => (
                                            <button key={t} type="button" onClick={() => setBingrType(t)}
                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${bingrType === t ? 'bg-purple-600 text-white' : 'bg-black/40 text-zinc-400'}`}>
                                                {t === 'movie' ? 'Movie' : t === 'tv' ? 'Series' : t === 'anime' ? 'Anime (AniList)' : 'Anime (MAL)'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <input type="text" placeholder={bingrType.startsWith('anime') ? 'AniList / MAL ID' : 'TMDB ID'} value={tmdbFetchId} onChange={e => setTmdbFetchId(e.target.value)}
                                            className="bg-black/50 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none flex-1 min-w-[120px]" />
                                        {bingrType !== 'movie' && (
                                            <>
                                                {bingrType === 'tv' && <input type="text" placeholder="Season" value={season} onChange={e => setSeason(e.target.value)} className="bg-black/50 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none w-20" />}
                                                <input type="text" placeholder="Episode" value={episode} onChange={e => setEpisode(e.target.value)} className="bg-black/50 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none w-20" />
                                            </>
                                        )}
                                        <button type="button" onClick={applyBingrPattern} className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-colors">
                                            Apply to Video URL
                                        </button>
                                    </div>
                                </div>

                                {/* Video / Embed URL */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Video Source / Embed URL</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="text"
                                                placeholder="Paste Bingr URL, iframe snippet, or MP4 link — or use auto-fetch above"
                                                value={formData.videoUrl}
                                                onChange={e => {
                                                    const raw = e.target.value;
                                                    const parsed = parseEmbedUrl(raw);
                                                    setFormData({ ...formData, videoUrl: parsed.embedUrl || raw });
                                                }}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-white text-sm font-mono focus:outline-none focus:border-brand-purple/50"
                                                required
                                            />
                                        </div>
                                        <label className={`cursor-pointer ${uploadingVideo ? 'bg-brand-purple' : 'bg-white/5 hover:bg-white/10'} text-white px-4 rounded-xl border border-white/10 flex items-center justify-center transition-colors min-w-[90px] text-xs font-semibold`}>
                                            {uploadingVideo ? <><Loader className="animate-spin mr-1" size={14} />Uploading</> : <><Upload size={14} className="mr-1" />Upload</>}
                                            <input type="file" className="hidden" accept="video/*" disabled={uploadingVideo} onChange={async e => {
                                                const file = e.target.files?.[0];
                                                if (file) { const url = await handleFileUpload(file, 'video'); if (url) setFormData(p => ({ ...p, videoUrl: url })); }
                                            }} />
                                        </label>
                                    </div>
                                    {formData.videoUrl && (
                                        <div className="flex items-center justify-between p-2.5 bg-black/30 rounded-xl border border-white/10">
                                            <p className="text-xs text-green-400 font-mono truncate flex-1 mr-3">{parsedEmbed.embedUrl}</p>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${parsedEmbed.isBingr ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30' : parsedEmbed.isIframe ? 'bg-blue-900/60 text-blue-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                                                {parsedEmbed.isBingr ? '🎬 Bingr' : parsedEmbed.isIframe ? '📺 iFrame' : '🎞 Direct'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Genre */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Genre (comma separated)</label>
                                    <input type="text" placeholder="Action, Sci-Fi, Drama" value={formData.genre}
                                        onChange={e => setFormData({ ...formData, genre: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-brand-purple/50" required />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description / Synopsis</label>
                                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Auto-filled from TMDB or enter manually"
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-brand-purple/50 min-h-[90px] resize-none" required />
                                </div>

                                {/* Featured */}
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="featured" checked={formData.featured}
                                        onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                                        className="w-5 h-5 rounded accent-purple-500" />
                                    <label htmlFor="featured" className="text-white text-sm font-medium cursor-pointer">
                                        Feature on homepage hero
                                    </label>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => { setShowAddForm(false); resetForm(); }}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-medium transition-colors text-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={uploadingPoster || uploadingVideo}
                                        className="flex-1 bg-gradient-to-r from-brand-purple to-brand-pink text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 text-sm">
                                        {editingMovie ? 'Update Movie' : 'Add Movie'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Movies Grid ───────────────────────────────────────────── */}
            {isLoading ? (
                <div className="text-center py-16">
                    <Loader className="animate-spin text-brand-purple mx-auto" size={40} />
                </div>
            ) : movies.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                    <Film size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No movies yet. Add your first one above!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {movies.map(movie => {
                        const parsed = parseEmbedUrl(movie.videoUrl);
                        return (
                            <div key={movie._id as unknown as string}
                                className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-brand-purple/50 transition-all group">
                                <div className="relative">
                                    <img src={movie.posterUrl} alt={movie.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    {parsed.isBingr && (
                                        <span className="absolute top-3 left-3 bg-purple-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-purple-500/40 text-[10px] font-bold text-purple-200">
                                            🎬 Bingr
                                        </span>
                                    )}
                                    {parsed.isIframe && !parsed.isBingr && (
                                        <span className="absolute top-3 left-3 bg-blue-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-blue-500/40 text-[10px] font-bold text-blue-200">
                                            📺 Embed
                                        </span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-white mb-1">{movie.title}</h3>
                                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{movie.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-500">{movie.year}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(movie)}
                                                className="p-2 bg-white/5 hover:bg-brand-purple/20 text-brand-purple rounded-lg transition-colors">
                                                <Edit2 size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(movie._id as unknown as string)}
                                                className="p-2 bg-white/5 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
