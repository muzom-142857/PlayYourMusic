"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { PlayerAdapter } from "@/store/playerStore";

/**
 * Apple Music requires MusicKit JS and an active Apple Music subscription.
 * For now, we expose a "fallback to external link" adapter
 * and render an Apple Music embed iframe for preview.
 */
export function AppleMusicAdapter({ url }: { url: string }) {
  const { setAdapter, setIsLoading } = usePlayerStore();

  const embedUrl = url
    .replace("music.apple.com", "embed.music.apple.com")
    .replace(/\?.*$/, "");

  useEffect(() => {
    setIsLoading(false);

    const noop: PlayerAdapter = {
      load: () => {},
      play: () => window.open(url, "_blank"),
      pause: () => {},
      seekTo: () => {},
      setVolume: () => {},
      destroy: () => {},
    };
    setAdapter(noop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <iframe
      src={embedUrl}
      className="hidden"
      allow="autoplay *; encrypted-media *; fullscreen *"
      sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
    />
  );
}
