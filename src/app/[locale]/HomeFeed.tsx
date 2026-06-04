"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { MasonryGrid } from "@/components/playlist/MasonryGrid";
import type { PlaylistDTO, PaginatedResponse } from "@/types";

async function fetchPlaylists(page: number) {
  const res = await fetch(`/api/playlists?sort=recommended&limit=20&page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch playlists");
  return res.json() as Promise<PaginatedResponse<PlaylistDTO>>;
}

export function HomeFeed() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["playlists", "home"],
    queryFn: ({ pageParam }) => fetchPlaylists(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length + 1 : undefined),
  });

  const allPlaylists = data?.pages.flatMap((p) => p.items) ?? [];

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === "pending") {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="py-16 text-center text-muted-foreground">
        플레이리스트를 불러오지 못했습니다.
      </div>
    );
  }

  if (allPlaylists.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        아직 플레이리스트가 없습니다. 첫 번째 플레이리스트를 만들어보세요!
      </div>
    );
  }

  return (
    <MasonryGrid
      playlists={allPlaylists}
      hasMore={hasNextPage}
      isLoading={isFetchingNextPage}
      onLoadMore={loadMore}
    />
  );
}
