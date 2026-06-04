"use client";

import { useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { TrackDTO } from "@/types";
import type { TrackMetadata } from "@/lib/metadata-fetcher";
import Image from "next/image";

interface AddTrackModalProps {
  playlistId: string;
  open: boolean;
  onClose: () => void;
  onAdded: (track: TrackDTO) => void;
}

export function AddTrackModal({ playlistId, open, onClose, onAdded }: AddTrackModalProps) {
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<TrackMetadata | null>(null);
  const [titleOverride, setTitleOverride] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const fetchMeta = async () => {
    if (!url.trim()) return;
    setIsFetching(true);
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error("Failed");
      const data: TrackMetadata = await res.json();
      setMeta(data);
      setTitleOverride(data.title);
    } catch {
      toast.error("URL에서 정보를 가져오지 못했습니다.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAdd = async () => {
    if (!url.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId,
          sourceUrl: url.trim(),
          title: titleOverride || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to add track");
      const track: TrackDTO = await res.json();
      onAdded(track);
      setUrl("");
      setMeta(null);
      setTitleOverride("");
      onClose();
      toast.success("트랙이 추가되었습니다.");
    } catch {
      toast.error("트랙 추가에 실패했습니다.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>트랙 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="track-url" className="sr-only">URL</Label>
              <Input
                id="track-url"
                placeholder="YouTube, Spotify, SoundCloud, Apple Music URL"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setMeta(null); }}
                onKeyDown={(e) => e.key === "Enter" && fetchMeta()}
              />
            </div>
            <Button variant="secondary" onClick={fetchMeta} disabled={isFetching || !url.trim()}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            </Button>
          </div>

          {meta && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              {meta.thumbnailUrl && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded">
                  <Image src={meta.thumbnailUrl} alt={meta.title} fill className="object-cover" sizes="48px" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <Input
                  value={titleOverride}
                  onChange={(e) => setTitleOverride(e.target.value)}
                  className="h-7 text-sm"
                  placeholder="트랙 제목"
                />
                {meta.artist && <p className="text-xs text-muted-foreground truncate">{meta.artist}</p>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleAdd} disabled={isAdding || !url.trim()}>
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
