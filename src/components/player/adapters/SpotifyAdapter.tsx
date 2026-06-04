"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { PlayerAdapter } from "@/store/playerStore";
import { extractSpotifyId } from "@/lib/platform-detector";

/**
 * Spotify Web Playback SDK requires Spotify Premium.
 * For non-premium users we fall back to the ExternalAdapter (open in Spotify).
 *
 * Full SDK integration is deferred to a future phase.
 * For now this adapter embeds the Spotify preview iframe for 30-second clips.
 */
export function SpotifyAdapter({ url }: { url: string }) {
  const { setAdapter, setIsLoading } = usePlayerStore();

  const resource = extractSpotifyId(url);
  const embedUrl = resource
    ? `https://open.spotify.com/embed/${resource.type}/${resource.id}?utm_source=generator&theme=0`
    : null;

  useEffect(() => {
    setIsLoading(false);

    const noop: PlayerAdapter = {
      load: () => {},
      play: () => {},
      pause: () => {},
      seekTo: () => {},
      setVolume: () => {},
      destroy: () => {},
    };
    setAdapter(noop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (!embedUrl) return null;

  return (
    <iframe
      src={embedUrl}
      className="hidden"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
