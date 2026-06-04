import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(["all", "playlists", "users"]).default("all"),
  category: z.string().optional(),
  tag: z.string().optional(),
  sort: z.enum(["relevance", "popular", "newest", "most_tracks"]).default("relevance"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const parsed = searchSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

  const { q, type, category, tag, sort, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const results: { playlists?: unknown[]; users?: unknown[]; total: number } = { total: 0 };

  if (type === "all" || type === "playlists") {
    const orderBy =
      sort === "popular"
        ? [{ likeCount: "desc" as const }]
        : sort === "most_tracks"
        ? [{ trackCount: "desc" as const }]
        : [{ createdAt: "desc" as const }];

    const where = {
      isPublic: true,
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { user: { name: { contains: q, mode: "insensitive" as const } } },
        { user: { username: { contains: q, mode: "insensitive" as const } } },
        { tags: { some: { name: { contains: q, mode: "insensitive" as const } } } },
        { tracks: { some: { title: { contains: q, mode: "insensitive" as const } } } },
        { tracks: { some: { artist: { contains: q, mode: "insensitive" as const } } } },
      ],
      ...(category && { categories: { some: { slug: category } } }),
      ...(tag && { tags: { some: { name: tag } } }),
    };

    const [playlists, total] = await Promise.all([
      prisma.playlist.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          user: { select: { id: true, name: true, username: true, avatarUrl: true } },
          tags: { select: { id: true, name: true } },
          categories: { select: { id: true, name: true, slug: true, emoji: true } },
          _count: { select: { tracks: true, comments: true } },
        },
      }),
      prisma.playlist.count({ where }),
    ]);

    // Attach isLiked
    let items = playlists;
    if (session?.user?.id) {
      const likedIds = new Set(
        (
          await prisma.playlistLike.findMany({
            where: { userId: session.user.id, playlistId: { in: playlists.map((p) => p.id) } },
            select: { playlistId: true },
          })
        ).map((l) => l.playlistId)
      );
      items = playlists.map((p) => ({ ...p, isLiked: likedIds.has(p.id) }));
    }

    results.playlists = items;
    results.total = total;
  }

  if (type === "all" || type === "users") {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
      },
      take: type === "all" ? 5 : limit,
      skip: type === "all" ? 0 : offset,
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        _count: { select: { playlists: { where: { isPublic: true } }, followers: true } },
      },
    });
    results.users = users;
  }

  return NextResponse.json(results);
}
