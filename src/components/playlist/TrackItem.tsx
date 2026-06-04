"use client";

import Image from "next/image";
import { GripVertical, X, Music2, ExternalLink } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TrackDTO } from "@/types";

const PLATFORM_LABELS: Record<string, string> = {
  YOUTUBE: "YouTube",
  SPOTIFY: "Spotify",
  APPLE_MUSIC: "Apple Music",
  SOUNDCLOUD: "SoundCloud",
  OTHER: "Link",
};

interface TrackItemProps {
  track: TrackDTO;
  index: number;
  isActive?: boolean;
  isEditable?: boolean;
  onPlay?: (index: number) => void;
  onRemove?: (trackId: string) => void;
}

export function TrackItem({ track, index, isActive, isEditable, onPlay, onRemove }: TrackItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
    disabled: !isEditable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg p-2 group transition-colors",
        isDragging ? "opacity-50 bg-muted" : "hover:bg-muted/50",
        isActive && "bg-muted"
      )}
    >
      {isEditable && (
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab text-muted-foreground opacity-0 group-hover:opacity-100"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Position number / play button */}
      <button
        onClick={() => onPlay?.(index)}
        className="flex h-8 w-7 shrink-0 items-center justify-center text-xs text-muted-foreground"
        aria-label={`Play ${track.title}`}
      >
        <span className={cn("group-hover:hidden", isActive && "hidden")}>{index + 1}</span>
        <span className={cn("hidden group-hover:block", isActive && "!block text-foreground")}>▶</span>
      </button>

      {/* Thumbnail */}
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded">
        {track.thumbnailUrl ? (
          <Image src={track.thumbnailUrl} alt={track.title} fill className="object-cover" sizes="32px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Music2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", isActive && "text-foreground font-medium")}>{track.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {track.artist ?? PLATFORM_LABELS[track.sourcePlatform] ?? ""}
        </p>
      </div>

      {/* Duration */}
      {track.duration && (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {formatDuration(track.duration)}
        </span>
      )}

      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={track.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label="Open source">
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </a>
        {isEditable && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onRemove(track.id)}
            aria-label="Remove track"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
