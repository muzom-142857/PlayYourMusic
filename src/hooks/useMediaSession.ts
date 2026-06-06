"use client";

import { useEffect } from "react";
import { usePlayerStore, selectCurrentTrack } from "@/store/playerStore";

export function useMediaSession() {
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const playlist = usePlayerStore((s) => s.playlist);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist ?? "",
      album: playlist?.title ?? "",
      artwork: currentTrack.thumbnailUrl
        ? [{ src: currentTrack.thumbnailUrl, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });
  }, [currentTrack, playlist]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !duration || !currentTrack) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(progress * duration, duration),
        playbackRate: 1,
      });
    } catch { /* setPositionState unsupported */ }
  }, [progress, duration, currentTrack]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.setActionHandler("play", togglePlay);
    navigator.mediaSession.setActionHandler("pause", togglePlay);
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
    navigator.mediaSession.setActionHandler("previoustrack", playPrev);

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
    };
  }, [togglePlay, playNext, playPrev]);
}
