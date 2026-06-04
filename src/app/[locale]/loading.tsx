import { MasonryGridSkeleton } from "@/components/common/Skeleton";

export default function HomeLoading() {
  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mb-6 h-8 w-56 animate-pulse rounded-md bg-muted" />
      <MasonryGridSkeleton count={12} />
    </div>
  );
}
