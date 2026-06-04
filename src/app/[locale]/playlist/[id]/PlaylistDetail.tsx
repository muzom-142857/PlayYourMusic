"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Play, Plus, Share2, Edit, Trash2, Music2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrackList } from "@/components/playlist/TrackList";
import { AddTrackModal } from "@/components/playlist/AddTrackModal";
import { PlaylistLikeButton } from "@/components/playlist/PlaylistLikeButton";
import { CommentSection } from "@/components/playlist/CommentSection";
import { useColorExtraction } from "@/hooks/useColorExtraction";
import { usePlayer } from "@/hooks/usePlayer";
import { formatCount } from "@/lib/utils";
import type { PlaylistWithTracksDTO, TrackDTO } from "@/types";

interface PlaylistDetailProps {
  playlist: PlaylistWithTracksDTO & { isLiked: boolean };
  isOwner: boolean;
}

export function PlaylistDetail({ playlist: initialPlaylist, isOwner }: PlaylistDetailProps) {
  const locale = useLocale();
  const router = useRouter();
  const { playPlaylist, currentTrack, playlist: activePlaylist } = usePlayer();

  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [isAddTrackOpen, setIsAddTrackOpen] = useState(false);

  // Extract colors from cover
  useColorExtraction(playlist.coverUrl);

  const isCurrentlyPlaying = activePlaylist?.id === playlist.id;
  const currentTrackId = isCurrentlyPlaying ? currentTrack?.id : null;

  const handlePlay = (startIndex = 0) => {
    playPlaylist(playlist, playlist.tracks, startIndex);
  };

  const handleTrackAdded = (track: TrackDTO) => {
    setPlaylist((p) => ({ ...p, tracks: [...p.tracks, track], trackCount: p.trackCount + 1 }));
  };

  const removeTrackMutation = useMutation<void, Error, string>({
    mutationFn: async (trackId: string) => {
      const res = await fetch(`/api/tracks?id=${trackId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: (_, trackId) => {
      setPlaylist((p) => ({
        ...p,
        tracks: p.tracks.filter((t) => t.id !== trackId),
        trackCount: p.trackCount - 1,
      }));
      toast.success("트랙이 삭제되었습니다.");
    },
    onError: () => toast.error("트랙 삭제에 실패했습니다."),
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", playlistId: playlist.id, orderedIds }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onMutate: (orderedIds) => {
      const reordered = orderedIds.map((tid, i) => {
        const t = playlist.tracks.find((tr) => tr.id === tid)!;
        return { ...t, position: i };
      });
      setPlaylist((p) => ({ ...p, tracks: reordered }));
    },
    onError: () => toast.error("순서 변경에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/playlists/${playlist.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast.success("플레이리스트가 삭제되었습니다.");
      router.push(`/${locale}`);
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사되었습니다!");
    } catch {
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <motion.div
        className="relative flex flex-col sm:flex-row gap-6 p-6 pb-8"
        style={{
          background: `linear-gradient(to bottom, var(--playlist-primary, hsl(var(--muted))) 0%, transparent 100%)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Cover */}
        <div className="relative h-48 w-48 shrink-0 overflow-hidden rounded-xl shadow-2xl self-start">
          {playlist.coverUrl ? (
            <Image src={playlist.coverUrl} alt={playlist.title} fill className="object-cover" sizes="192px" priority />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Music2 className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-col justify-end gap-3 min-w-0">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              플레이리스트
            </p>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">{playlist.title}</h1>
            {playlist.description && (
              <p className="text-muted-foreground text-sm max-w-lg">{playlist.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/${locale}/user/${playlist.user.username}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
              <Avatar className="h-5 w-5">
                <AvatarImage src={playlist.user.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">{playlist.user.name[0]}</AvatarFallback>
              </Avatar>
              <span>{playlist.user.name}</span>
            </Link>
            <span>·</span>
            <span>{playlist.trackCount}곡</span>
            <span>·</span>
            <span>{formatCount(playlist.playCount)} 재생</span>
          </div>

          {/* Tags */}
          {playlist.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {playlist.categories.map((cat) => (
                <Badge key={cat.id} variant="secondary">{cat.emoji} {cat.name}</Badge>
              ))}
              {playlist.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="text-xs">#{tag.name}</Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button onClick={() => handlePlay(0)} size="lg" className="gap-2 rounded-full px-6" disabled={playlist.tracks.length === 0}>
              <Play className="h-4 w-4" fill="currentColor" />
              재생
            </Button>

            <PlaylistLikeButton
              playlistId={playlist.id}
              likeCount={playlist.likeCount}
              isLiked={playlist.isLiked}
            />

            <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>

            {isOwner && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${locale}/playlist/${playlist.id}/edit`}>
                    <Edit className="mr-1.5 h-3.5 w-3.5" />
                    편집
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate()}
                  aria-label="Delete playlist"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Track list + sidebar */}
      <div className="flex flex-col lg:flex-row gap-8 px-6 pb-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">트랙</h2>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setIsAddTrackOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                트랙 추가
              </Button>
            )}
          </div>

          {playlist.tracks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <Music2 className="h-10 w-10 opacity-30" />
              <p className="text-sm">아직 트랙이 없습니다</p>
              {isOwner && (
                <Button variant="outline" size="sm" onClick={() => setIsAddTrackOpen(true)}>
                  첫 번째 트랙 추가
                </Button>
              )}
            </div>
          ) : (
            <TrackList
              tracks={playlist.tracks}
              currentTrackId={currentTrackId}
              isEditable={isOwner}
              onPlay={handlePlay}
              onRemove={(id) => removeTrackMutation.mutate(id)}
              onReorder={(ids) => reorderMutation.mutate(ids)}
            />
          )}
        </div>

        {/* Comments */}
        <div className="w-full lg:w-80 shrink-0">
          <Separator className="mb-6 lg:hidden" />
          <CommentSection playlistId={playlist.id} />
        </div>
      </div>

      {isOwner && (
        <AddTrackModal
          playlistId={playlist.id}
          open={isAddTrackOpen}
          onClose={() => setIsAddTrackOpen(false)}
          onAdded={handleTrackAdded}
        />
      )}
    </div>
  );
}
