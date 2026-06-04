import { Skeleton } from "@/components/common/Skeleton";

export default function ExploreLoading() {
  return (
    <div className="px-4 py-6 lg:px-6">
      <Skeleton className="mb-2 h-8 w-32" />
      <Skeleton className="mb-8 h-4 w-64" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 22 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
