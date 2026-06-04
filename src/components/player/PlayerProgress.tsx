"use client";

import { usePlayerStore } from "@/store/playerStore";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/utils";

export function PlayerProgress() {
  const { progress, duration, seekTo } = usePlayerStore();
  const currentSec = Math.floor(progress * duration);

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="w-8 text-right text-[10px] text-muted-foreground tabular-nums">
        {formatDuration(currentSec)}
      </span>
      <Slider
        value={[progress * 100]}
        min={0}
        max={100}
        step={0.1}
        onValueChange={([v]) => seekTo((v / 100) * duration)}
        className="flex-1 h-1"
        aria-label="Playback progress"
      />
      <span className="w-8 text-[10px] text-muted-foreground tabular-nums">
        {duration > 0 ? formatDuration(Math.floor(duration)) : "--:--"}
      </span>
    </div>
  );
}
