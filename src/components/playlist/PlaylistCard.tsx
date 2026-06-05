"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Play, Music2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { cn, formatCount } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PlaylistDTO } from "@/types";

interface PlaylistCardProps {
  playlist: PlaylistDTO;
  onPlay?: (playlist: PlaylistDTO) => void;
  style?: React.CSSProperties;
}

export function PlaylistCard({ playlist, onPlay, style }: PlaylistCardProps) {
  const locale = useLocale();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const method = playlist.isLiked ? "DELETE" : "POST";
      const res = await fetch(`/api/playlists/${playlist.id}/likes`, { method });
      if (!res.ok) throw new Error("Like failed");
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["playlists"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) return;
    likeMutation.mutate();
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPlay?.(playlist);
  };

  // Card height based on track count for Pinterest masonry
  const minHeight = 200;
  const trackHeight = 28;
  const cardHeight = minHeight + playlist.trackCount * trackHeight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={style}
    >
      <Link href={`/${locale}/playlist/${playlist.id}`} className="block group">
        <div
          className="relative overflow-hidden rounded-xl border border-border/60 bg-card transition-shadow hover:shadow-lg"
          style={{ minHeight }}
        >
          {/* Cover */}
          <div className="relative h-40 w-full overflow-hidden bg-muted">
            {playlist.coverUrl ? (
              <Image
                src={playlist.coverUrl}
                alt={playlist.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <Music2 className="h-10 w-10 text-muted-foreground/30" />
              </div>
            )}

            {/* Play overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePlay}
              role="button"
              aria-label="Play playlist"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md">
                <Play className="h-5 w-5 text-black ml-0.5" fill="black" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 space-y-2" style={{ minHeight: cardHeight - 160 }}>
            <div>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2">{playlist.title}</h3>
              {playlist.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{playlist.description}</p>
              )}
            </div>

            {/* Tracks list (first 3) */}
            {playlist._count && playlist._count.tracks > 0 && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  {playlist.trackCount} tracks
                </p>
              </div>
            )}

            {/* Tags */}
            {playlist.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {playlist.categories.slice(0, 3).map((cat) => (
                  <Badge key={cat.id} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={playlist.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[8px]">{playlist.user.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-[11px] text-muted-foreground truncate">{playlist.user.name}</span>
              </div>

              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-1 text-[11px] transition-colors",
                  playlist.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-400"
                )}
                aria-label="Like"
              >
                <Heart
                  className="h-3.5 w-3.5"
                  fill={playlist.isLiked ? "currentColor" : "none"}
                />
                <span>{formatCount(playlist.likeCount)}</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
