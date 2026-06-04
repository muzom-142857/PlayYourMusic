import { prisma } from "./db";

interface RecommendationOptions {
  userId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Score-based playlist ranking:
 *   followBonus × 3  (creator is followed by user)
 *   + recency bonus  (newer playlists weighted higher, decays over 7 days)
 *   + popularity     (likeCount + playCount/10)
 *   + personal       (user has listened to playlists by this creator before)
 */
export async function getRecommendedPlaylists({
  userId,
  limit = 20,
  offset = 0,
}: RecommendationOptions) {
  // Fast path for anonymous users: just sort by popularity + recency
  if (!userId) {
    return prisma.playlist.findMany({
      where: { isPublic: true },
      orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: offset,
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
        tags: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true, slug: true, emoji: true } },
        _count: { select: { tracks: true, comments: true } },
      },
    });
  }

  // Fetch followed user IDs
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followedIds = follows.map((f) => f.followingId);

  // Fetch recent listening history (last 50)
  const history = await prisma.listeningHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { playlist: { select: { userId: true } } },
  });
  const listenedCreatorIds = new Set(history.map((h) => h.playlist.userId));

  // Fetch candidates
  const candidates = await prisma.playlist.findMany({
    where: { isPublic: true, userId: { not: userId } },
    orderBy: { createdAt: "desc" },
    take: limit * 5,
    skip: offset,
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      tags: { select: { id: true, name: true } },
      categories: { select: { id: true, name: true, slug: true, emoji: true } },
      _count: { select: { tracks: true, comments: true } },
    },
  });

  const now = Date.now();
  const scored = candidates.map((playlist) => {
    const followBonus = followedIds.includes(playlist.userId) ? 3.0 : 0;
    const ageMs = now - playlist.createdAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, 1 - ageDays / 7);
    const popularity = playlist.likeCount + playlist.playCount / 10;
    const personalBonus = listenedCreatorIds.has(playlist.userId) ? 0.5 : 0;

    return {
      ...playlist,
      _score: followBonus + recencyBonus + popularity * 0.01 + personalBonus,
    };
  });

  return scored
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _score, ...playlist }) => playlist);
}
