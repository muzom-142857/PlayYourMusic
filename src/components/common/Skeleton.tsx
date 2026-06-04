import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function PlaylistCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}

export function MasonryGridSkeleton({ count = 8 }: { count?: number }) {
  // Randomised heights to mimic masonry
  const heights = [200, 240, 280, 200, 260, 220, 280, 240];
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-0">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mb-3 break-inside-avoid">
          <div
            className="overflow-hidden rounded-xl border border-border/60 bg-card"
            style={{ height: heights[i % heights.length] }}
          >
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrackListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}
