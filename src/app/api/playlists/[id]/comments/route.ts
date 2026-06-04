import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const { id: playlistId } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = 20;

  const comments = await prisma.playlistComment.findMany({
    where: { playlistId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  const hasMore = comments.length > limit;
  const items = hasMore ? comments.slice(0, limit) : comments;
  const nextCursor = hasMore ? items[items.length - 1].id : undefined;

  return NextResponse.json({ items, hasMore, nextCursor });
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: playlistId } = await params;
  const body = await request.json();
  const parsed = z.object({ content: z.string().min(1).max(500) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid content" }, { status: 400 });

  const comment = await prisma.playlistComment.create({
    data: { content: parsed.data.content, userId: session.user.id, playlistId },
    include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}
