"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { TrackDTO, PlaylistDTO } from "@/types";

export type RepeatMode = "none" | "one" | "all";

export interface PlayerAdapter {
  load(url: string): void;
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  setVolume(volume: number): void;
  destroy(): void;
}

interface PlayerState {
  playlist: PlaylistDTO | null;
  queue: TrackDTO[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  prevVolume: number;
  isMuted: boolean;
  progress: number; // 0–1
  duration: number; // seconds
  shuffle: boolean;
  repeat: RepeatMode;
  // Adapter ref (not serialized)
  adapter: PlayerAdapter | null;
}

interface PlayerActions {
  loadPlaylist: (playlist: PlaylistDTO, tracks: TrackDTO[], startIndex?: number) => void;
  playTrack: (index: number) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  setRepeat: (mode: RepeatMode) => void;
  setAdapter: (adapter: PlayerAdapter | null) => void;
  clearPlayer: () => void;
}

const initialState: PlayerState = {
  playlist: null,
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  isLoading: false,
  volume: 0.8,
  prevVolume: 0.8,
  isMuted: false,
  progress: 0,
  duration: 0,
  shuffle: false,
  repeat: "none",
  adapter: null,
};

export const usePlayerStore = create<PlayerState & PlayerActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    loadPlaylist: (playlist, tracks, startIndex = 0) => {
      set({ playlist, queue: tracks, currentIndex: startIndex, isPlaying: true, progress: 0, duration: 0 });
    },

    playTrack: (index) => {
      const { queue } = get();
      if (index < 0 || index >= queue.length) return;
      set({ currentIndex: index, isPlaying: true, progress: 0, duration: 0 });
    },

    playNext: () => {
      const { currentIndex, queue, repeat, shuffle } = get();
      if (queue.length === 0) return;
      if (repeat === "one") {
        set({ progress: 0 });
        get().adapter?.seekTo(0);
        return;
      }
      let next: number;
      if (shuffle) {
        next = Math.floor(Math.random() * queue.length);
      } else {
        next = currentIndex + 1;
        if (next >= queue.length) {
          if (repeat === "all") next = 0;
          else { set({ isPlaying: false }); return; }
        }
      }
      set({ currentIndex: next, isPlaying: true, progress: 0, duration: 0 });
    },

    playPrev: () => {
      const { currentIndex, queue, progress } = get();
      if (queue.length === 0) return;
      // If more than 3s into track, restart; otherwise go to previous
      if (progress * get().duration > 3) {
        get().adapter?.seekTo(0);
        set({ progress: 0 });
        return;
      }
      const prev = Math.max(0, currentIndex - 1);
      set({ currentIndex: prev, isPlaying: true, progress: 0, duration: 0 });
    },

    togglePlay: () => {
      const { isPlaying, adapter } = get();
      if (isPlaying) {
        adapter?.pause();
        set({ isPlaying: false });
      } else {
        adapter?.play();
        set({ isPlaying: true });
      }
    },

    setIsPlaying: (playing) => set({ isPlaying: playing }),
    setIsLoading: (loading) => set({ isLoading: loading }),

    seekTo: (seconds) => {
      get().adapter?.seekTo(seconds);
      const { duration } = get();
      set({ progress: duration > 0 ? seconds / duration : 0 });
    },

    setVolume: (volume) => {
      const clamped = Math.max(0, Math.min(1, volume));
      get().adapter?.setVolume(clamped);
      set({ volume: clamped });
    },

    toggleMute: () => {
      const { isMuted, volume, prevVolume, adapter } = get();
      if (isMuted) {
        const restore = prevVolume || 0.8;
        adapter?.setVolume(restore);
        set({ isMuted: false, volume: restore });
      } else {
        set({ prevVolume: volume });
        adapter?.setVolume(0);
        set({ isMuted: true });
      }
    },

    setProgress: (progress) => set({ progress }),
    setDuration: (duration) => set({ duration }),
    toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
    setRepeat: (mode) => set({ repeat: mode }),

    setAdapter: (adapter) => {
      get().adapter?.destroy();
      set({ adapter });
    },

    clearPlayer: () => {
      get().adapter?.destroy();
      set(initialState);
    },
  }))
);

// Selector helpers
export const selectCurrentTrack = (state: PlayerState) => state.queue[state.currentIndex] ?? null;
export const selectIsActive = (state: PlayerState) => state.playlist !== null;
