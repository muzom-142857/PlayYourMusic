import type { Platform } from "@/generated/prisma/enums";

export type { Platform };

const PATTERNS: { platform: Platform; patterns: RegExp[] }[] = [
  {
    platform: "YOUTUBE",
    patterns: [
      /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    ],
  },
  {
    platform: "SPOTIFY",
    patterns: [/open\.spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/],
  },
  {
    platform: "APPLE_MUSIC",
    patterns: [/music\.apple\.com\/[a-z]{2}\/(album|song|playlist)\//],
  },
  {
    platform: "SOUNDCLOUD",
    patterns: [/soundcloud\.com\/[^/]+\/[^/]+/],
  },
];

export function detectPlatform(url: string): Platform {
  for (const { platform, patterns } of PATTERNS) {
    if (patterns.some((p) => p.test(url))) return platform;
  }
  return "OTHER";
}

/** Extract YouTube video ID from URL */
export function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

/** Extract Spotify track/resource ID */
export function extractSpotifyId(url: string): { type: string; id: string } | null {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
  if (!match) return null;
  return { type: match[1], id: match[2] };
}

/** Extract SoundCloud embed URL from track URL */
export function buildSoundCloudEmbedUrl(trackUrl: string): string {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
}
