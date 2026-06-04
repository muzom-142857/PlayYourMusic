"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useLocale } from "next-intl";
import type { CommentDTO } from "@/types";

interface CommentSectionProps {
  playlistId: string;
}

export function CommentSection({ playlistId }: CommentSectionProps) {
  const locale = useLocale();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data } = useQuery({
    queryKey: ["comments", playlistId],
    queryFn: async () => {
      const res = await fetch(`/api/playlists/${playlistId}/comments`);
      return res.json() as Promise<{ items: CommentDTO[]; hasMore: boolean }>;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/playlists/${playlistId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", playlistId] });
      setContent("");
    },
    onError: () => toast.error("댓글 작성에 실패했습니다."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    submitMutation.mutate(content.trim());
  };

  const dateLocale = locale === "ko" ? ko : enUS;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">댓글 {data?.items.length ?? 0}</h3>

      {session && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 남겨보세요..."
            rows={2}
            className="resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!content.trim() || submitMutation.isPending}
            className="shrink-0 self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="space-y-4">
        {data?.items.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={comment.user.avatarUrl ?? undefined} />
              <AvatarFallback className="text-xs">{comment.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: dateLocale })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
