"use client";

import { MasonryScroller, useContainerPosition, usePositioner, useResizeObserver } from "masonic";
import { useRef, useCallback } from "react";
import { PlaylistCard } from "./PlaylistCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { usePlayer } from "@/hooks/usePlayer";
import type { PlaylistDTO } from "@/types";

interface MasonryGridProps {
  playlists: PlaylistDTO[];
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

interface MasonryItemProps {
  data: PlaylistDTO;
  width: number;
  index: number;
}

export function MasonryGrid({ playlists, hasMore = false, isLoading = false, onLoadMore }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { offset, width } = useContainerPosition(containerRef, [playlists.length]);
  const { playPlaylist } = usePlayer();

  const positioner = usePositioner(
    {
      width,
      columnWidth: 220,
      columnGutter: 12,
    },
    [playlists.length]
  );

  const resizeObserver = useResizeObserver(positioner);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: onLoadMore ?? (() => {}),
    hasMore,
    isLoading,
  });

  const renderCard = useCallback(
    ({ data }: MasonryItemProps) => (
      <PlaylistCard
        playlist={data}
        onPlay={async (pl) => {
          // Fetch full playlist with tracks
          const res = await fetch(`/api/playlists/${pl.id}`);
          if (!res.ok) return;
          const full = await res.json();
          playPlaylist(full, full.tracks ?? [], 0);
        }}
      />
    ),
    [playPlaylist]
  );

  return (
    <div ref={containerRef} className="w-full">
      {width > 0 && (
        <MasonryScroller
          positioner={positioner}
          resizeObserver={resizeObserver}
          containerRef={containerRef}
          items={playlists}
          height={typeof window !== "undefined" ? window.innerHeight : 800}
          offset={offset}
          overscanBy={5}
          render={renderCard}
        />
      )}

      <div ref={sentinelRef} className="h-4" />

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
        </div>
      )}
    </div>
  );
}
