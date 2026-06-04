"use client";

import { create } from "zustand";
import type { CoverColors } from "@/types";

interface ThemeState {
  coverColors: CoverColors | null;
  setCoverColors: (colors: CoverColors | null) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  coverColors: null,
  setCoverColors: (colors) => set({ coverColors: colors }),
}));
