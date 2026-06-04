import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: playlistId } = await params;

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
