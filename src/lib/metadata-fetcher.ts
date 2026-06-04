import { detectPlatform, extractYouTubeId } from "./platform-detector";
import type { Platform } from "./platform-detector";

export interface TrackMetadata {
  title: string;
  artist: string | null;
  duration: number | null;
  thumbnailUrl: string | null;
  sourcePlatform: Platform;
  sourceUrl: string;
}

/** Fetch track metadata from a streaming URL */
export async function fetchTrackMetadata(url: string): Promise<TrackMetadata> {
  const platform = detectPlatform(url);
  const base: Pick<TrackMetadata, "sourcePlatform" | "sourceUrl"> = {
    sourcePlatform: platform,
    sourceUrl: url,
  };

  try {
    switch (platform) {
      case "YOUTUBE":
        return { ...base, ...(await fetchYouTubeMetadata(url)) };
      case "SPOTIFY":
        return { ...base, ...(await fetchOEmbedMetadata(url, "https://open.spotify.com/oembed")) };
      case "SOUNDCLOUD":
        return { ...base, ...(await fetchOEmbedMetadata(url, "https://soundcloud.com/oembed")) };
      case "APPLE_MUSIC":
        return { ...base, ...(await fetchOEmbedMetadata(url, "https://music.apple.com/oembed")) };
      default:
        return { ...base, title: new URL(url).hostname, artist: null, duration: null, thumbnailUrl: null };
    }
  } catch {
    // Fallback: parse what we can from the URL
    return { ...base, title: url, artist: null, duration: null, thumbnailUrl: null };
  }
}

async function fetchYouTubeMetadata(
  url: string
): Promise<Omit<TrackMetadata, "sourcePlatform" | "sourceUrl">> {
  const videoId = extractYouTubeId(url);

  // Use oEmbed as it doesn't require an API key
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });

  if (!res.ok) {
    return {
      title: videoId ? `YouTube: ${videoId}` : "YouTube Video",
      artist: null,
      duration: null,
      thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
    };
  }

  const data = (await res.json()) as { title: string; author_name: string; thumbnail_url: string };
  return {
    title: data.title,
    artist: data.author_name ?? null,
    duration: null, // oEmbed doesn't provide duration; would need YouTube Data API
    thumbnailUrl: data.thumbnail_url ?? (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null),
  };
}

async function fetchOEmbedMetadata(
  url: string,
  oembedEndpoint: string
): Promise<Omit<TrackMetadata, "sourcePlatform" | "sourceUrl">> {
  const oembedUrl = `${oembedEndpoint}?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl, { next: { revalidate: 3600 } });

  if (!res.ok) {
    return { title: url, artist: null, duration: null, thumbnailUrl: null };
  }

  const data = (await res.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };

  return {
    title: data.title ?? url,
    artist: data.author_name ?? null,
    duration: null,
    thumbnailUrl: data.thumbnail_url ?? null,
  };
}
