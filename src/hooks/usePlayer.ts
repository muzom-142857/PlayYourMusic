"use client";

import { usePlayerStore, selectCurrentTrack, selectIsActive } from "@/store/playerStore";
import type { PlaylistDTO, TrackDTO } from "@/types";

export function usePlayer() {
  const store = usePlayerStore();
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const isActive = usePlayerStore(selectIsActive);

  const playPlaylist = (playlist: PlaylistDTO, tracks: TrackDTO[], startIndex = 0) => {
    store.loadPlaylist(playlist, tracks, startIndex);
  };

  return {
    ...store,
    currentTrack,
    isActive,
    playPlaylist,
  };
}
