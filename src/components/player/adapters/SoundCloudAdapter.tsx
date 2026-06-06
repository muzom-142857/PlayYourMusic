"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { PlayerAdapter } from "@/store/playerStore";
import { buildSoundCloudEmbedUrl } from "@/lib/platform-detector";

export function SoundCloudAdapter({ url }: { url: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { setAdapter, setIsPlaying, setIsLoading, playNext } = usePlayerStore();

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    setIsLoading(true);

    const adapter: PlayerAdapter = {
      load: () => {},
      play: () => {
        iframe.contentWindow?.postMessage(JSON.stringify({ method: "play" }), "*");
      },
      pause: () => {
        iframe.contentWindow?.postMessage(JSON.stringify({ method: "pause" }), "*");
      },
      seekTo: (s) => {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ method: "seekTo", value: s * 1000 }),
          "*"
        );
      },
      setVolume: (v) => {
        iframe.contentWindow?.postMessage(
          JSON.stringify({ method: "setVolume", value: v * 100 }),
          "*"
        );
      },
      destroy: () => {},
    };
    setAdapter(adapter);

    const handleMessage = (e: MessageEvent<string>) => {
      try {
        const data = JSON.parse(e.data) as { method?: string; soundcloud?: boolean };
        if (data.method === "ready") {
          setIsLoading(false);
          // Autoplay if the store says we should be playing (e.g. skipped from another track)
          if (usePlayerStore.getState().isPlaying) {
            iframe.contentWindow?.postMessage(JSON.stringify({ method: "play" }), "*");
          }
        }
        if (data.method === "playProgress") setIsLoading(false);
        if (data.method === "play") setIsPlaying(true);
        if (data.method === "pause") setIsPlaying(false);
        if (data.method === "finish") playNext();
      } catch { /* ignore non-JSON */ }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <iframe
      ref={iframeRef}
      src={buildSoundCloudEmbedUrl(url)}
      className="hidden"
      allow="autoplay"
    />
  );
}
