"use client";

import { Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, formatCount } from "@/lib/utils";
import { localePath } from "@/lib/locale-path";

interface PlaylistLikeButtonProps {
  playlistId: string;
  likeCount: number;
  isLiked: boolean;
}

export function PlaylistLikeButton({ playlistId, likeCount, isLiked }: PlaylistLikeButtonProps) {
  const { data: session } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/playlists/${playlistId}/likes`, {
        method: isLiked ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
    },
    onError: () => toast.error("좋아요 처리에 실패했습니다."),
  });

  const handleClick = () => {
    if (!session) {
      router.push(localePath(locale, "/login"));
      return;
    }
    mutation.mutate();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={cn("gap-2", isLiked && "border-red-500/50 text-red-500")}
    >
      <Heart
        className="h-4 w-4"
        fill={isLiked ? "currentColor" : "none"}
      />
      {formatCount(likeCount)}
    </Button>
  );
}
