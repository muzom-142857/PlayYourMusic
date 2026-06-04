"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { PlayerAdapter } from "@/store/playerStore";
import { extractYouTubeId } from "@/lib/platform-detector";

// Minimal YouTube IFrame API types (avoids UMD/ambient global conflicts)
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getDuration(): number;
  getCurrentTime(): number;
  destroy(): void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data: number;
}

interface YTPlayerOptions {
  videoId: string;
  playerVars?: Record<string, number | string>;
  events?: {
    onReady?: (e: YTPlayerEvent) => void;
    onStateChange?: (e: YTPlayerEvent) => void;
  };
}

// Use numeric constants instead of relying on PlayerState enum
const YT_STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: YTPlayerOptions) => YTPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

let ytApiLoaded = false;
let ytApiCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  if (ytApiLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    ytApiCallbacks.push(resolve);
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiCallbacks.forEach((cb) => cb());
      ytApiCallbacks = [];
    };
  });
}

interface YouTubeAdapterProps {
  url: string;
}

export function YouTubeAdapter({ url }: YouTubeAdapterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const { setAdapter, setIsPlaying, setIsLoading, setProgress, setDuration, playNext } =
    usePlayerStore();

  useEffect(() => {
    const videoId = extractYouTubeId(url);
    if (!videoId || !containerRef.current) return;

    setIsLoading(true);
    let destroyed = false;

    loadYouTubeAPI().then(() => {
      if (destroyed || !containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            if (destroyed) return;
            setIsLoading(false);
            setDuration(e.target.getDuration());
            e.target.playVideo();

            const adapter: PlayerAdapter = {
              load: () => {},
              play: () => e.target.playVideo(),
              pause: () => e.target.pauseVideo(),
              seekTo: (s) => e.target.seekTo(s, true),
              setVolume: (v) => e.target.setVolume(v * 100),
              destroy: () => { playerRef.current?.destroy(); },
            };
            setAdapter(adapter);
          },
          onStateChange: (e) => {
            if (destroyed) return;
            if (e.data === YT_STATE.PLAYING) {
              setIsPlaying(true);
              setIsLoading(false);
            } else if (e.data === YT_STATE.PAUSED) {
              setIsPlaying(false);
            } else if (e.data === YT_STATE.ENDED) {
              playNext();
            } else if (e.data === YT_STATE.BUFFERING) {
              setIsLoading(true);
            }
          },
        },
      });
    });

    // Progress ticker
    const ticker = setInterval(() => {
      if (!playerRef.current) return;
      const curr = playerRef.current.getCurrentTime();
      const total = playerRef.current.getDuration();
      if (total > 0) setProgress(curr / total);
    }, 500);

    return () => {
      destroyed = true;
      clearInterval(ticker);
      playerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return <div ref={containerRef} className="hidden" />;
}
