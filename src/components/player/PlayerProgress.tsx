"use client";

import { usePlayerStore } from "@/store/playerStore";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/utils";
import { motion } from "framer-motion";

export function PlayerProgress() {
  const { progress, duration, seekTo } = usePlayerStore();
  const currentSec = Math.floor(progress * duration);

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="w-8 text-right text-[10px] text-muted-foreground tabular-nums">
        {formatDuration(currentSec)}
      </span>

      {/* Animated progress fill beneath the slider */}
      <div className="relative flex-1">
        <Slider
          value={[progress * 100]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={([v]) => seekTo((v / 100) * duration)}
          className="h-1"
          aria-label="Playback progress"
        />
        {/* Vibrant accent under slider thumb */}
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-[var(--playlist-vibrant,hsl(var(--primary)))] opacity-30"
          style={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.2, ease: "linear" }}
        />
      </div>

      <span className="w-8 text-[10px] text-muted-foreground tabular-nums">
        {duration > 0 ? formatDuration(Math.floor(duration)) : "--:--"}
      </span>
    </div>
  );
}
