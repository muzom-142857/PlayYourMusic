import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

async function requirePlaylistAccess(playlistId: string, userId: string) {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { isPublic: true, userId: true },
  });
  if (!playlist) return { ok: false, status: 404, error: "Not found" } as const;
  if (!playlist.isPublic && playlist.userId !== userId)
    return { ok: false, status: 403, error: "Forbidden" } as const;
  return { ok: true } as const;
}

export async function POST(_: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: playlistId } = await params;

  const access = await requirePlaylistAccess(playlistId, session.user.id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  await prisma.$transaction([
    prisma.playlistLike.upsert({
      where: { userId_playlistId: { userId: session.user.id, playlistId } },
      create: { userId: session.user.id, playlistId },
      update: {},
    }),
    prisma.playlist.update({
      where: { id: playlistId },
      data: { likeCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ liked: true });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: playlistId } = await params;

  const access = await requirePlaylistAccess(playlistId, session.user.id);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const deleted = await prisma.playlistLike.deleteMany({
    where: { userId: session.user.id, playlistId },
  });

  if (deleted.count > 0) {
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { likeCount: { decrement: 1 } },
    });
  }

  return NextResponse.json({ liked: false });
}
