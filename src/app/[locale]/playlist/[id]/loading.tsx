import { Skeleton, TrackListSkeleton } from "@/components/common/Skeleton";

export default function PlaylistLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="flex flex-col sm:flex-row gap-6 p-6 pb-8">
        <Skeleton className="h-48 w-48 rounded-xl shrink-0" />
        <div className="flex flex-col justify-end gap-3 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
      </div>
      {/* Tracks skeleton */}
      <div className="px-6 pb-8">
        <Skeleton className="mb-3 h-4 w-16" />
        <TrackListSkeleton count={8} />
      </div>
    </div>
  );
}
