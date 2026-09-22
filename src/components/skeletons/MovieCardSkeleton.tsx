export default function MovieCardSkeleton() {
    return (
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-zinc-700 rounded w-1/2" />
            </div>
        </div>
    );
}
