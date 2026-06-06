import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { deleteObject, keyFromUrl } from "@/lib/r2";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
  coverUrl: z.string().url().nullable().optional(),
  coverColors: z.record(z.string(), z.unknown()).nullable().optional(),
  tagNames: z.array(z.string().max(30)).max(10).optional(),
  categoryIds: z.array(z.string()).max(5).optional(),
});

export async function GET(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      tracks: { orderBy: { position: "asc" } },
      tags: { select: { id: true, name: true } },
      categories: { select: { id: true, name: true, slug: true, emoji: true } },
      _count: { select: { comments: true } },
    },
  });

  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!playlist.isPublic && playlist.userId !== session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let isLiked = false;
  if (session?.user?.id) {
    const like = await prisma.playlistLike.findUnique({
      where: { userId_playlistId: { userId: session.user.id, playlistId: id } },
    });
    isLiked = !!like;
  }

  // Increment play count (fire-and-forget)
  prisma.playlist.update({ where: { id }, data: { playCount: { increment: 1 } } }).catch(() => null);
  if (session?.user?.id) {
    prisma.listeningHistory.create({ data: { userId: session.user.id, playlistId: id } }).catch(() => null);
  }

  return NextResponse.json({ ...playlist, isLiked });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const playlist = await prisma.playlist.findUnique({ where: { id }, select: { userId: true, coverUrl: true } });
  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (playlist.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { tagNames, categoryIds, coverColors, ...rest } = parsed.data;

  // Prisma v7 nullable JSON: null must use JsonNull sentinel
  const resolvedCoverColors =
    coverColors === null
      ? Prisma.JsonNull
      : coverColors !== undefined
      ? (coverColors as Prisma.InputJsonValue)
      : undefined;

  // If cover changed and old cover was from R2, delete it
  if (rest.coverUrl !== undefined && playlist.coverUrl && rest.coverUrl !== playlist.coverUrl) {
    const key = keyFromUrl(playlist.coverUrl);
    if (key) deleteObject(key).catch(() => null);
  }

  const updated = await prisma.playlist.update({
    where: { id },
    data: {
      ...rest,
      ...(resolvedCoverColors !== undefined && { coverColors: resolvedCoverColors }),
      ...(tagNames !== undefined && {
        tags: {
          set: [],
          connectOrCreate: tagNames.map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      }),
      ...(categoryIds !== undefined && {
        categories: { set: categoryIds.map((cid) => ({ id: cid })) },
      }),
    },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      tags: true,
      categories: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const playlist = await prisma.playlist.findUnique({ where: { id }, select: { userId: true, coverUrl: true } });
  if (!playlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (playlist.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (playlist.coverUrl) {
    const key = keyFromUrl(playlist.coverUrl);
    if (key) deleteObject(key).catch(() => null);
  }

  await prisma.playlist.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
