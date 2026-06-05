"use client";

import { usePlayerStore, selectCurrentTrack } from "@/store/playerStore";
import { detectPlatform } from "@/lib/platform-detector";
import { YouTubeAdapter } from "./adapters/YouTubeAdapter";
import { SpotifyAdapter } from "./adapters/SpotifyAdapter";
import { SoundCloudAdapter } from "./adapters/SoundCloudAdapter";
import { AppleMusicAdapter } from "./adapters/AppleMusicAdapter";
import { ExternalAdapter } from "./adapters/ExternalAdapter";
import { PlayerControls } from "./PlayerControls";
import { PlayerProgress } from "./PlayerProgress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLocale } from "next-intl";

function PlatformAdapter({ url }: { url: string }) {
  const platform = detectPlatform(url);
  switch (platform) {
    case "YOUTUBE":     return <YouTubeAdapter url={url} />;
    case "SPOTIFY":     return <SpotifyAdapter url={url} />;
    case "SOUNDCLOUD":  return <SoundCloudAdapter url={url} />;
    case "APPLE_MUSIC": return <AppleMusicAdapter url={url} />;
    default:            return <ExternalAdapter url={url} />;
  }
}

export function GlobalPlayer() {
  const locale = useLocale();
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const playlist = usePlayerStore((s) => s.playlist);

  return (
    <>
      {/* Hidden audio adapters */}
      {currentTrack && <PlatformAdapter url={currentTrack.sourceUrl} />}

      <AnimatePresence>
        {currentTrack && playlist && (
          <motion.div
            key="player"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-14 lg:bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-md"
          >
            <div className="relative flex items-center gap-3 px-3 py-2 lg:px-6">
              {/* Track info */}
              <Link
                href={`/${locale}/playlist/${playlist.id}`}
                className="flex items-center gap-2.5 min-w-0 w-44 shrink-0"
              >
                <Avatar className="h-9 w-9 rounded-md shrink-0">
                  <AvatarImage src={currentTrack.thumbnailUrl ?? undefined} alt={currentTrack.title} />
                  <AvatarFallback className="rounded-md text-xs">M</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium leading-tight">{currentTrack.title}</p>
                  {currentTrack.artist && (
                    <p className="truncate text-xs text-muted-foreground">{currentTrack.artist}</p>
                  )}
                </div>
              </Link>

              {/* Controls + Progress */}
              <div className="flex flex-1 flex-col items-center gap-1 relative">
                <PlayerControls />
                <PlayerProgress />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
