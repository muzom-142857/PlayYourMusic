"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";
import type { CoverColors } from "@/types";

export function useColorExtraction(coverUrl: string | null | undefined) {
  const setCoverColors = useThemeStore((s) => s.setCoverColors);

  useEffect(() => {
    if (!coverUrl) {
      setCoverColors(null);
      return;
    }

    let cancelled = false;

    async function extract() {
      try {
        const { Vibrant } = await import("node-vibrant/browser");
        const palette = await Vibrant.from(coverUrl!).getPalette();

        if (cancelled) return;

        const colors: CoverColors = {
          primary: palette.DarkVibrant?.hex ?? palette.Vibrant?.hex ?? "#1a1a2e",
          secondary: palette.DarkMuted?.hex ?? palette.Muted?.hex ?? "#16213e",
          muted: palette.LightMuted?.hex ?? "#8892b0",
          vibrant: palette.Vibrant?.hex ?? "#6c63ff",
          darkVibrant: palette.DarkVibrant?.hex ?? "#4a4580",
        };
        setCoverColors(colors);
      } catch {
        // Silently fail – keep previous colors
      }
    }

    extract();
    return () => { cancelled = true; };
  }, [coverUrl, setCoverColors]);
}
