import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
    return (
        <div className="min-h-screen bg-black pt-20 pb-10 overflow-hidden">
            {/* Hero Skeleton */}
            <div className="w-full h-[60vh] relative mb-12 mx-4 md:mx-8 rounded-2xl overflow-hidden mt-8">
                <Skeleton className="w-full h-full bg-zinc-900" />
                <div className="absolute bottom-10 left-10 space-y-4 z-10 w-full max-w-2xl">
                    <Skeleton className="h-12 w-3/4 bg-zinc-800" />
                    <Skeleton className="h-4 w-full bg-zinc-800" />
                    <Skeleton className="h-4 w-5/6 bg-zinc-800" />
                    <div className="flex gap-4 pt-4">
                        <Skeleton className="h-12 w-32 rounded-full bg-zinc-800" />
                        <Skeleton className="h-12 w-32 rounded-full bg-zinc-800" />
                    </div>
                </div>
                {/* Gradient overlay for skeleton */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>

            {/* Sections Skeleton */}
            <div className="px-4 md:px-8 space-y-12">
                {/* Tabs Skeleton */}
                <div className="flex gap-4 mb-8 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-24 rounded-full bg-zinc-900 shrink-0" />
                    ))}
                </div>

                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-8 w-48 bg-zinc-900" />
                        <div className="flex gap-4 overflow-hidden">
                            {Array.from({ length: 6 }).map((_, j) => (
                                <Skeleton key={j} className="h-64 w-44 shrink-0 rounded-lg bg-zinc-900" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
