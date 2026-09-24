export function movieLookup(id: string) {
    if (/^[a-f\d]{24}$/i.test(id)) return { _id: id };
    if (/^\d{1,12}$/.test(id)) return {
        $or: [
            { videoUrl: id },
            { videoUrl: { $regex: `^https?://(?:www\\.)?bingr\\.one/watch/movie/${id}(?:[/?#]|$)`, $options: 'i' } },
            { videoUrl: { $regex: `^https?://vidlink\\.pro/movie/${id}(?:[/?#]|$)`, $options: 'i' } },
            { videoUrl: { $regex: `^https?://multiembed\\.mov/\\?(?=[^#]*video_id=${id}(?:&|$))(?=[^#]*tmdb=1(?:&|$))(?![^#]*[?&]s=)`, $options: 'i' } },
        ],
    };
    return null;
}
