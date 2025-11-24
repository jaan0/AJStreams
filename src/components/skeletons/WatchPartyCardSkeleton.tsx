export default function WatchPartyCardSkeleton() {
    return (
        <div className="bg-zinc-900 rounded-xl overflow-hidden border border-white/5 animate-pulse">
            {/* Thumbnail */}
            <div className="aspect-video bg-zinc-800" />

            {/* Content */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="h-5 bg-zinc-800 rounded w-2/3" />
                    <div className="h-4 bg-zinc-800 rounded w-16" />
                </div>

                <div className="h-4 bg-zinc-800 rounded w-1/2 mb-4" />

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-800" />
                        <div className="h-3 bg-zinc-800 rounded w-20" />
                    </div>
                    <div className="h-8 bg-zinc-800 rounded w-24" />
                </div>
            </div>
        </div>
    );
}
