import type { Platform } from "@/generated/prisma/enums";

export type { Platform };

export interface TrackDTO {
  id: string;
  title: string;
  artist: string | null;
  duration: number | null;
  sourceUrl: string;
  sourcePlatform: Platform;
  thumbnailUrl: string | null;
  position: number;
  playlistId: string;
}

export interface UserDTO {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

export interface TagDTO {
  id: string;
  name: string;
}

export interface PlaylistDTO {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  coverColors: CoverColors | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: UserDTO;
  likeCount: number;
  playCount: number;
  trackCount: number;
  tags: TagDTO[];
  categories: CategoryDTO[];
  _count?: { tracks: number; comments: number };
  isLiked?: boolean;
}

export interface PlaylistWithTracksDTO extends PlaylistDTO {
  tracks: TrackDTO[];
}

export interface CoverColors {
  primary: string;
  secondary: string;
  muted: string;
  vibrant: string;
  darkVibrant: string;
}

export interface CommentDTO {
  id: string;
  content: string;
  createdAt: string;
  user: UserDTO;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}
