"use client";

import { useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MasonryGrid } from "@/components/playlist/MasonryGrid";
import type { PlaylistDTO, PaginatedResponse } from "@/types";

type FeedTab = "recommended" | "following" | "newest";

async function fetchPlaylists(sort: FeedTab, page: number) {
  const res = await fetch(`/api/playlists?sort=${sort}&limit=20&page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch playlists");
  return res.json() as Promise<PaginatedResponse<PlaylistDTO>>;
}

function Feed({ sort }: { sort: FeedTab }) {
  const t = useTranslations("home");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["playlists", sort],
    queryFn: ({ pageParam }) => fetchPlaylists(sort, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length + 1 : undefined),
  });

  const all = data?.pages.flatMap((p) => p.items) ?? [];
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

  if (all.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {sort === "following" ? t("emptyFollowing") : t("emptyPlaylists")}
      </div>
    );
  }

  return <MasonryGrid playlists={all} hasMore={hasNextPage} isLoading={isFetchingNextPage} onLoadMore={loadMore} />;
}

export function HomeFeed() {
  const t = useTranslations("home");
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<FeedTab>("recommended");

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FeedTab)} className="mb-6">
        <TabsList>
          <TabsTrigger value="recommended">{t("tabs.recommended")}</TabsTrigger>
          {session?.user && <TabsTrigger value="following">{t("tabs.following")}</TabsTrigger>}
          <TabsTrigger value="newest">{t("tabs.newest")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <Feed sort={activeTab} />
    </div>
  );
}
