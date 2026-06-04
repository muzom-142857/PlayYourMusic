"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const coverColors = useThemeStore((s) => s.coverColors);

  useEffect(() => {
    const root = document.documentElement;
    if (coverColors) {
      root.style.setProperty("--playlist-primary", coverColors.primary);
      root.style.setProperty("--playlist-secondary", coverColors.secondary);
      root.style.setProperty("--playlist-muted", coverColors.muted);
      root.style.setProperty("--playlist-vibrant", coverColors.vibrant);
    } else {
      root.style.removeProperty("--playlist-primary");
      root.style.removeProperty("--playlist-secondary");
      root.style.removeProperty("--playlist-muted");
      root.style.removeProperty("--playlist-vibrant");
    }
  }, [coverColors]);

  return <>{children}</>;
}
