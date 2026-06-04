"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { PlayerAdapter } from "@/store/playerStore";

export function ExternalAdapter({ url }: { url: string }) {
  const { setAdapter, setIsLoading } = usePlayerStore();

  useEffect(() => {
    setIsLoading(false);

    const adapter: PlayerAdapter = {
      load: () => window.open(url, "_blank"),
      play: () => window.open(url, "_blank"),
      pause: () => {},
      seekTo: () => {},
      setVolume: () => {},
      destroy: () => {},
    };
    setAdapter(adapter);
    // Open external link immediately on load
    window.open(url, "_blank");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return null;
}
