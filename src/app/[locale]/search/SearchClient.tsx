"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { MasonryGrid } from "@/components/playlist/MasonryGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocale } from "next-intl";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PlaylistDTO, PaginatedResponse, CategoryDTO } from "@/types";

const PLATFORMS = [
  { value: "all", label: "전체 플랫폼" },
  { value: "YOUTUBE", label: "YouTube" },
  { value: "SPOTIFY", label: "Spotify" },
  { value: "SOUNDCLOUD", label: "SoundCloud" },
  { value: "APPLE_MUSIC", label: "Apple Music" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "관련도순" },
  { value: "popular", label: "인기순" },
  { value: "newest", label: "최신순" },
  { value: "most_tracks", label: "트랙 많은 순" },
];

interface SearchFilters {
  sort: string;
  category: string;
  platform: string;
}

interface SearchResult {
  playlists?: PlaylistDTO[];
  users?: Array<{
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    _count: { playlists: number; followers: number };
  }>;
  total: number;
  hasMore: boolean;
}

interface SearchClientProps {
  categories: CategoryDTO[];
}

async function fetchSearch(
  q: string,
  filters: SearchFilters,
  page: number
): Promise<PaginatedResponse<PlaylistDTO> & { users?: SearchResult["users"] }> {
  const params = new URLSearchParams({
    q,
    sort: filters.sort,
    page: String(page),
    limit: "20",
  });
  if (filters.category) params.set("category", filters.category);
  const res = await fetch(`/api/search?${params}`);
  if (!res.ok) throw new Error("Search failed");
  const data: SearchResult = await res.json();
  return {
    items: data.playlists ?? [],
    total: data.total,
    hasMore: (data.playlists?.length ?? 0) === 20,
    users: data.users,
  };
}

export function SearchClient({ categories }: SearchClientProps) {
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    sort: "relevance",
    category: "",
    platform: "all",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["search", submittedQuery, filters],
    queryFn: ({ pageParam }) => fetchSearch(submittedQuery, filters, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length + 1 : undefined),
    enabled: submittedQuery.trim().length > 0,
  });

  const playlists = data?.pages.flatMap((p) => p.items) ?? [];
  const users = data?.pages[0]?.users ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmittedQuery(query.trim());
  };

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const activeFiltersCount =
    (filters.category ? 1 : 0) +
    (filters.platform !== "all" ? 1 : 0) +
    (filters.sort !== "relevance" ? 1 : 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="플레이리스트, 트랙, 아티스트 또는 사용자 검색..."
            className="pl-9 pr-9 h-11 rounded-full"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setSubmittedQuery(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" className="rounded-full px-5">검색</Button>
      </form>

      {/* Filters */}
      {submittedQuery && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 mb-6"
        >
          {/* Category chips */}
          <button
            onClick={() => setFilters((f) => ({ ...f, category: "" }))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              !filters.category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-foreground"
            )}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setFilters((f) => ({ ...f, category: f.category === cat.slug ? "" : cat.slug }))
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filters.category === cat.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            {/* Sort + Platform dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  필터
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">정렬</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={filters.sort}
                  onValueChange={(v) => setFilters((f) => ({ ...f, sort: v }))}
                >
                  {SORT_OPTIONS.map((o) => (
                    <DropdownMenuRadioItem key={o.value} value={o.value} className="text-sm">
                      {o.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">플랫폼</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={filters.platform}
                  onValueChange={(v) => setFilters((f) => ({ ...f, platform: v }))}
                >
                  {PLATFORMS.map((p) => (
                    <DropdownMenuRadioItem key={p.value} value={p.value} className="text-sm">
                      {p.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {!submittedQuery ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-24 text-muted-foreground"
          >
            <Search className="h-10 w-10 opacity-20" />
            <p className="text-sm">플레이리스트, 트랙, 아티스트, 사용자를 검색해보세요</p>
          </motion.div>
        ) : status === "pending" ? (
          <motion.div key="loading" className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          </motion.div>
        ) : (
          <motion.div key={submittedQuery} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="mb-4 text-sm text-muted-foreground">
              <strong className="text-foreground">&quot;{submittedQuery}&quot;</strong> 검색 결과{" "}
              {total > 0 ? `— 플레이리스트 ${total}개` : ""}
            </p>

            {/* Users */}
            {users.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">사용자</h2>
                <div className="flex flex-wrap gap-3">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/${locale}/user/${user.username}`}
                      className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-4 py-2.5 hover:bg-accent transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-tight">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{user.username} · {user._count.playlists} playlists
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Playlists */}
            {playlists.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다. 다른 키워드로 시도해보세요.
              </div>
            ) : (
              <>
                {users.length > 0 && (
                  <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">플레이리스트</h2>
                )}
                <MasonryGrid
                  playlists={playlists}
                  hasMore={hasNextPage}
                  isLoading={isFetchingNextPage}
                  onLoadMore={loadMore}
                />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
