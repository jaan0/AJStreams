'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Upload, X, Film, Calendar, Link as LinkIcon, Check, Loader, PlayCircle } from 'react-feather';
import { IMovie } from '@/models/Movie';
import { motion, AnimatePresence } from 'framer-motion';
import { parseEmbedUrl, createBingrMovieUrl, createBingrTvUrl, createBingrAnimeUrl, createBingrAnimeMalUrl } from '@/lib/embed';

export default function MoviesTab() {
    const [movies, setMovies] = useState<IMovie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMovie, setEditingMovie] = useState<IMovie | null>(null);
    const [uploadingPoster, setUploadingPoster] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);

    // Bingr Quick Builder State
    const [bingrType, setBingrType] = useState<'movie' | 'tv' | 'anime' | 'anime-mal'>('movie');
    const [tmdbId, setTmdbId] = useState('');
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

    const handleFileUpload = async (file: File, type: 'image' | 'video') => {
        if (type === 'image') setUploadingPoster(true);
        else setUploadingVideo(true);

        try {
            const signRes = await fetch('/api/cloudinary/sign', { method: 'POST' });
            if (!signRes.ok) {
                const err = await signRes.json();
                throw new Error(err.message || 'Failed to sign request');
            }
            const { signature, timestamp } = await signRes.json();

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

            if (!cloudName || !apiKey) {
                throw new Error('Cloudinary configuration missing');
            }

            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('api_key', apiKey);
            uploadFormData.append('timestamp', timestamp.toString());
            uploadFormData.append('signature', signature);
            uploadFormData.append('cloud_name', cloudName);

            const uploadRes = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`,
                {
                    method: 'POST',
                    body: uploadFormData,
                }
            );

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.error?.message || 'Upload to Cloudinary failed');
            }

            const data = await uploadRes.json();
            return data.secure_url;
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.message}`);
            return null;
        } finally {
            if (type === 'image') setUploadingPoster(false);
            else setUploadingVideo(false);
        }
    };

    const applyBingrPattern = () => {
        if (!tmdbId.trim()) return;
        let generatedUrl = '';
        if (bingrType === 'movie') {
            generatedUrl = createBingrMovieUrl(tmdbId.trim());
        } else if (bingrType === 'tv') {
            generatedUrl = createBingrTvUrl(tmdbId.trim(), season || 1, episode || 1);
        } else if (bingrType === 'anime') {
            generatedUrl = createBingrAnimeUrl(tmdbId.trim(), episode || 1);
        } else if (bingrType === 'anime-mal') {
            generatedUrl = createBingrAnimeMalUrl(tmdbId.trim(), episode || 1);
        }
        setFormData(prev => ({ ...prev, videoUrl: generatedUrl }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingMovie ? 'PUT' : 'POST';
            const parsed = parseEmbedUrl(formData.videoUrl);

            const body = {
                ...formData,
                videoUrl: parsed.embedUrl || formData.videoUrl,
                genre: formData.genre.split(',').map((g) => g.trim()),
                _id: editingMovie?._id
            };

            const res = await fetch('/api/movies', {
                method: method,
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
        if (!confirm('Are you sure you want to delete this movie?')) return;

        try {
            const res = await fetch('/api/movies', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: id }),
            });

            if (res.ok) {
                fetchMovies();
            }
        } catch (error) {
            console.error('Failed to delete movie', error);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            posterUrl: '',
            videoUrl: '',
            genre: '',
            year: new Date().getFullYear(),
            featured: false,
        });
        setTmdbId('');
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">Movie & Stream Library</h2>
                    <p className="text-xs text-zinc-400 mt-1">Accepts Bingr embeds (<code className="text-purple-400">https://bingr.one/embed</code>), TMDB IDs, iframe HTML, or MP4 links.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingMovie(null);
                        resetForm();
                        setShowAddForm(true);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-brand-purple to-brand-pink text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/25"
                >
                    <Plus size={20} />
                    Add Movie / Embed
                </button>
            </div>

            {/* Add/Edit Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">
                                    {editingMovie ? 'Edit Movie / Embed' : 'Add New Movie / Embed'}
                                </h3>
                                <button onClick={() => setShowAddForm(false)} className="text-zinc-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Title</label>
                                        <div className="relative">
                                            <Film size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple/50"
                                                placeholder="e.g. Avatar: The Way of Water"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Year</label>
                                        <div className="relative">
                                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="number"
                                                value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple/50"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Poster Upload */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Poster Image URL</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="text"
                                                placeholder="Poster Image URL"
                                                value={formData.posterUrl}
                                                onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple/50"
                                                required
                                            />
                                        </div>
                                        <label className={`cursor-pointer ${uploadingPoster ? 'bg-brand-purple' : 'bg-white/5 hover:bg-white/10'} text-white px-4 rounded-xl border border-white/10 flex items-center justify-center transition-colors min-w-[100px]`}>
                                            {uploadingPoster ? (
                                                <>
                                                    <Loader className="animate-spin mr-2" size={16} />
                                                    Uploading...
                                                </>
                                            ) : formData.posterUrl ? (
                                                <>
                                                    <Check className="mr-2 text-green-500" size={16} />
                                                    Uploaded
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={16} className="mr-2" />
                                                    Upload
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                disabled={uploadingPoster}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = await handleFileUpload(file, 'image');
                                                        if (url) setFormData(prev => ({ ...prev, posterUrl: url }));
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    {formData.posterUrl && (
                                        <div className="mt-2 p-2 bg-black/30 rounded-xl border border-white/10">
                                            <p className="text-xs text-zinc-500 mb-2">Preview:</p>
                                            <img
                                                src={formData.posterUrl}
                                                alt="Poster preview"
                                                className="w-32 h-48 object-cover rounded-lg"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://via.placeholder.com/128x192?text=Invalid+URL';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Bingr Embed Helper Tool */}
                                <div className="p-4 bg-purple-950/30 border border-purple-500/20 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                                            <PlayCircle size={14} /> Bingr Embed Generator (<code className="text-purple-300">bingr.one</code>)
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setBingrType('movie')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${bingrType === 'movie' ? 'bg-purple-600 text-white' : 'bg-black/40 text-zinc-400'}`}
                                            >
                                                Movie
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBingrType('tv')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${bingrType === 'tv' ? 'bg-purple-600 text-white' : 'bg-black/40 text-zinc-400'}`}
                                            >
                                                Series
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBingrType('anime')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${bingrType === 'anime' ? 'bg-purple-600 text-white' : 'bg-black/40 text-zinc-400'}`}
                                            >
                                                Anime (AniList)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBingrType('anime-mal')}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${bingrType === 'anime-mal' ? 'bg-purple-600 text-white' : 'bg-black/40 text-zinc-400'}`}
                                            >
                                                Anime (MAL)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder={bingrType.startsWith('anime') ? 'Anime ID (e.g. 1535)' : 'TMDB ID (e.g. 1007757)'}
                                            value={tmdbId}
                                            onChange={(e) => setTmdbId(e.target.value)}
                                            className="bg-black/50 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none flex-1 min-w-[150px]"
                                        />
                                        {bingrType === 'tv' && (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder="Season"
                                                    value={season}
                                                    onChange={(e) => setSeason(e.target.value)}
                                                    className="bg-black/50 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none w-20"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Episode"
                                                    value={episode}
                                                    onChange={(e) => setEpisode(e.target.value)}
                                                    className="bg-black/50 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none w-20"
                                                />
                                            </>
                                        )}
                                        {bingrType.startsWith('anime') && (
                                            <input
                                                type="text"
                                                placeholder="Episode"
                                                value={episode}
                                                onChange={(e) => setEpisode(e.target.value)}
                                                className="bg-black/50 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none w-20"
                                            />
                                        )}
                                        <button
                                            type="button"
                                            onClick={applyBingrPattern}
                                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-colors"
                                        >
                                            Generate Embed URL
                                        </button>
                                    </div>
                                </div>

                                {/* Video Source / Embed Code Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Video Source / Bingr Embed URL / iframe tag</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <LinkIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                            <input
                                                type="text"
                                                placeholder="Paste https://bingr.one/watch/movie/1007757, iframe snippet, or MP4 URL"
                                                value={formData.videoUrl}
                                                onChange={(e) => {
                                                    const raw = e.target.value;
                                                    const parsed = parseEmbedUrl(raw);
                                                    setFormData({ ...formData, videoUrl: parsed.embedUrl || raw });
                                                }}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-brand-purple/50 font-mono text-sm"
                                                required
                                            />
                                        </div>
                                        <label className={`cursor-pointer ${uploadingVideo ? 'bg-brand-purple' : 'bg-white/5 hover:bg-white/10'} text-white px-4 rounded-xl border border-white/10 flex items-center justify-center transition-colors min-w-[100px]`}>
                                            {uploadingVideo ? (
                                                <>
                                                    <Loader className="animate-spin mr-2" size={16} />
                                                    Uploading...
                                                </>
                                            ) : formData.videoUrl ? (
                                                <>
                                                    <Check className="mr-2 text-green-500" size={16} />
                                                    Set
                                                </>
                                            ) : (
                                                <>
                                                    <Upload size={16} className="mr-2" />
                                                    Upload
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="video/*"
                                                disabled={uploadingVideo}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = await handleFileUpload(file, 'video');
                                                        if (url) setFormData(prev => ({ ...prev, videoUrl: url }));
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {/* Video Preview Status */}
                                    {formData.videoUrl && (
                                        <div className="mt-2 p-3 bg-black/30 rounded-xl border border-white/10 space-y-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-zinc-400 font-medium">Embed Target:</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${parsedEmbed.isBingr ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30' : parsedEmbed.isIframe ? 'bg-blue-900/60 text-blue-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                                                    {parsedEmbed.isBingr ? 'Bingr Player Embed' : parsedEmbed.isIframe ? 'Iframe Embed' : 'Direct Video Stream'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-green-400 font-mono break-all">{parsedEmbed.embedUrl}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Genre (comma separated)</label>
                                    <input
                                        type="text"
                                        placeholder="Action, Sci-Fi, Drama"
                                        value={formData.genre}
                                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-purple/50"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-brand-purple/50 min-h-[100px]"
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        checked={formData.featured}
                                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                        className="w-5 h-5 rounded"
                                    />
                                    <label htmlFor="featured" className="text-white font-medium cursor-pointer">
                                        Feature this movie on homepage
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddForm(false)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploadingPoster || uploadingVideo}
                                        className="flex-1 bg-gradient-to-r from-brand-purple to-brand-pink text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
                                    >
                                        {editingMovie ? 'Update Movie' : 'Add Movie'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Movies Grid */}
            {isLoading ? (
                <div className="text-center py-12">
                    <Loader className="animate-spin text-brand-purple mx-auto" size={48} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {movies.map((movie) => {
                        const parsed = parseEmbedUrl(movie.videoUrl);
                        return (
                            <div key={(movie._id as unknown as string)} className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-brand-purple/50 transition-all">
                                <div className="relative">
                                    <img src={movie.posterUrl} alt={movie.title} className="w-full h-64 object-cover" />
                                    {parsed.isBingr && (
                                        <span className="absolute top-3 left-3 bg-purple-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-purple-500/40 text-[10px] font-bold text-purple-200">
                                            Bingr Embed
                                        </span>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-white mb-2">{movie.title}</h3>
                                    <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{movie.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-500">{movie.year}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(movie)}
                                                className="p-2 bg-white/5 hover:bg-brand-purple/20 text-brand-purple rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(movie._id as unknown as string)}
                                                className="p-2 bg-white/5 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
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
