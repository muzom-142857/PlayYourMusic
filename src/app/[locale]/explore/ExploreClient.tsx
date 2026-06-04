"use client";

import { useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MasonryGrid } from "@/components/playlist/MasonryGrid";
import { cn } from "@/lib/utils";
import type { PlaylistDTO, PaginatedResponse } from "@/types";

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  description: string | null;
  _count: { playlists: number };
}

interface ExploreClientProps {
  categories: CategoryInfo[];
}

// Gradient pairs per mood/genre – purely visual
const CATEGORY_GRADIENTS: Record<string, string> = {
  chill: "from-sky-900/60 to-indigo-900/60",
  focus: "from-slate-800/60 to-zinc-900/60",
  energetic: "from-orange-900/60 to-red-900/60",
  sad: "from-blue-900/60 to-slate-900/60",
  happy: "from-yellow-800/60 to-amber-900/60",
  romantic: "from-rose-900/60 to-pink-900/60",
  melancholic: "from-purple-900/60 to-indigo-900/60",
  indie: "from-teal-900/60 to-emerald-900/60",
  hiphop: "from-zinc-900/60 to-neutral-800/60",
  electronic: "from-cyan-900/60 to-blue-900/60",
  jazz: "from-amber-900/60 to-yellow-900/60",
  classical: "from-stone-800/60 to-neutral-900/60",
  pop: "from-fuchsia-900/60 to-pink-900/60",
  rnb: "from-violet-900/60 to-purple-900/60",
  rock: "from-red-900/60 to-zinc-900/60",
  workout: "from-lime-900/60 to-green-900/60",
  study: "from-blue-900/60 to-sky-900/60",
  sleep: "from-indigo-950/60 to-slate-950/60",
  party: "from-fuchsia-800/60 to-purple-900/60",
  drive: "from-orange-800/60 to-amber-900/60",
  morning: "from-orange-700/60 to-yellow-800/60",
  night: "from-slate-900/60 to-zinc-950/60",
};

async function fetchCategoryPlaylists(slug: string, page: number) {
  const res = await fetch(`/api/playlists?category=${slug}&sort=popular&limit=20&page=${page}`);
  if (!res.ok) throw new Error("fetch failed");
  return res.json() as Promise<PaginatedResponse<PlaylistDTO>>;
}

function CategoryPlaylists({ slug }: { slug: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["explore", slug],
    queryFn: ({ pageParam }) => fetchCategoryPlaylists(slug, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length + 1 : undefined),
  });

  const playlists = data?.pages.flatMap((p) => p.items) ?? [];
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (status === "pending") {
    return (
      <div className="flex justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        이 카테고리에는 아직 플레이리스트가 없습니다.
      </p>
    );
  }

  return (
    <MasonryGrid
      playlists={playlists}
      hasMore={hasNextPage}
      isLoading={isFetchingNextPage}
      onLoadMore={loadMore}
    />
  );
}

export function ExploreClient({ categories }: ExploreClientProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const activeCategory = categories.find((c) => c.slug === activeSlug);

  return (
    <div>
      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {categories.map((cat) => {
          const gradient = CATEGORY_GRADIENTS[cat.slug] ?? "from-zinc-800/60 to-zinc-900/60";
          const isActive = cat.slug === activeSlug;
          return (
            <motion.button
              key={cat.id}
              onClick={() => setActiveSlug(isActive ? null : cat.slug)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative flex h-24 flex-col items-start justify-end overflow-hidden rounded-xl p-3 text-left transition-all",
                `bg-gradient-to-br ${gradient}`,
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <span className="text-2xl leading-none">{cat.emoji ?? "🎵"}</span>
              <span className="mt-1 text-sm font-semibold text-white leading-tight">{cat.name}</span>
              <span className="text-[10px] text-white/60">{cat._count.playlists} playlists</span>
            </motion.button>
          );
        })}
      </div>

      {/* Per-category playlist feed */}
      <AnimatePresence mode="wait">
        {activeSlug && activeCategory && (
          <motion.div
            key={activeSlug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-8"
          >
            <div className="mb-6 flex items-center gap-2">
              <span className="text-2xl">{activeCategory.emoji}</span>
              <div>
                <h2 className="text-xl font-bold">{activeCategory.name}</h2>
                {activeCategory.description && (
                  <p className="text-sm text-muted-foreground">{activeCategory.description}</p>
                )}
              </div>
            </div>
            <CategoryPlaylists slug={activeSlug} />
          </motion.div>
        )}
      </AnimatePresence>

      {!activeSlug && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          카테고리를 선택해 플레이리스트를 탐색해보세요
        </p>
      )}
    </div>
  );
}
