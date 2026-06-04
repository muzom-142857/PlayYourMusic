"use client";

import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore, selectCurrentTrack } from "@/store/playerStore";
import { cn } from "@/lib/utils";

export function PlayerControls() {
  const {
    isPlaying, isLoading, shuffle, repeat, volume, isMuted,
    togglePlay, playNext, playPrev, toggleShuffle, setRepeat, setVolume, toggleMute,
  } = usePlayerStore();
  const currentTrack = usePlayerStore(selectCurrentTrack);

  const cycleRepeat = () => {
    setRepeat(repeat === "none" ? "all" : repeat === "all" ? "one" : "none");
  };

  return (
    <div className="flex flex-col items-center gap-1 w-full max-w-lg">
      {/* Transport */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 hidden sm:flex", shuffle && "text-primary")}
          onClick={toggleShuffle}
          aria-label="Shuffle"
        >
          <Shuffle className="h-3.5 w-3.5" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={playPrev} aria-label="Previous">
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={togglePlay}
          disabled={!currentTrack}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={playNext} aria-label="Next">
          <SkipForward className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 hidden sm:flex", repeat !== "none" && "text-primary")}
          onClick={cycleRepeat}
          aria-label="Repeat"
        >
          {repeat === "one" ? (
            <Repeat1 className="h-3.5 w-3.5" />
          ) : (
            <Repeat className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Volume (desktop only) */}
      <div className="hidden md:flex items-center gap-1.5 absolute right-4">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMute} aria-label="Mute">
          {isMuted || volume === 0 ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume * 100]}
          min={0}
          max={100}
          step={1}
          onValueChange={([v]) => setVolume(v / 100)}
          className="w-20 h-1"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
