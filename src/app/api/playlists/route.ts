import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRecommendedPlaylists } from "@/lib/recommendations";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  tagNames: z.array(z.string().max(30)).max(10).default([]),
  categoryIds: z.array(z.string()).max(5).default([]),
});

const listSchema = z.object({
  sort: z.enum(["recommended", "following", "newest", "popular", "most_tracks"]).default("recommended"),
  category: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  userId: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();
  const { searchParams } = new URL(request.url);
  const params = listSchema.safeParse(Object.fromEntries(searchParams));
  if (!params.success) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

  const { sort, category, tag, page, limit, userId } = params.data;
  const offset = (page - 1) * limit;

  const include = {
    user: { select: { id: true, name: true, username: true, avatarUrl: true } },
    tags: { select: { id: true, name: true } },
    categories: { select: { id: true, name: true, slug: true, emoji: true } },
    _count: { select: { tracks: true, comments: true } },
  } as const;

  const where = {
    isPublic: true,
    ...(category && { categories: { some: { slug: category } } }),
    ...(tag && { tags: { some: { name: tag } } }),
    ...(userId && { userId }),
  };

  if (sort === "recommended") {
    const items = await getRecommendedPlaylists({
      userId: session?.user?.id,
      limit,
      offset,
    });
    const total = await prisma.playlist.count({ where });
    return NextResponse.json({ items, total, hasMore: offset + items.length < total });
  }

  if (sort === "following") {
    if (!session?.user?.id) {
      return NextResponse.json({ items: [], total: 0, hasMore: false });
    }
    const follows = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });
    const followedIds = follows.map((f) => f.followingId);
    const followingWhere = { ...where, userId: { in: followedIds } };
    const [items, total] = await Promise.all([
      prisma.playlist.findMany({
        where: followingWhere,
        orderBy: [{ createdAt: "desc" }],
        take: limit,
        skip: offset,
        include,
      }),
      prisma.playlist.count({ where: followingWhere }),
    ]);
    return NextResponse.json({ items, total, hasMore: offset + items.length < total });
  }

  const orderBy =
    sort === "popular"
      ? [{ likeCount: "desc" as const }]
      : sort === "most_tracks"
      ? [{ trackCount: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const [items, total] = await Promise.all([
    prisma.playlist.findMany({ where, orderBy, take: limit, skip: offset, include }),
    prisma.playlist.count({ where }),
  ]);

  // Attach isLiked for authenticated user
  let itemsWithLike = items;
  if (session?.user?.id) {
    const likedIds = new Set(
      (
        await prisma.playlistLike.findMany({
          where: { userId: session.user.id, playlistId: { in: items.map((p) => p.id) } },
          select: { playlistId: true },
        })
      ).map((l) => l.playlistId)
    );
    itemsWithLike = items.map((p) => ({ ...p, isLiked: likedIds.has(p.id) }));
  }

  return NextResponse.json({ items: itemsWithLike, total, hasMore: offset + items.length < total });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { title, description, isPublic, tagNames, categoryIds } = parsed.data;

  const playlist = await prisma.playlist.create({
    data: {
      title,
      description,
      isPublic,
      userId: session.user.id,
      tags: {
        connectOrCreate: tagNames.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
      categories: { connect: categoryIds.map((id) => ({ id })) },
    },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      tags: true,
      categories: true,
    },
  });

  return NextResponse.json(playlist, { status: 201 });
}
