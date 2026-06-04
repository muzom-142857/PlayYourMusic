import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ username: string }> };

async function resolveUserId(username: string) {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  return user?.id;
}

export async function POST(_: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const targetId = await resolveUserId(username);
  if (!targetId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (targetId === session.user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  await prisma.follow.upsert({
    where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
    create: { followerId: session.user.id, followingId: targetId },
    update: {},
  });

  return NextResponse.json({ following: true });
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const targetId = await resolveUserId(username);
  if (!targetId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.follow.deleteMany({
    where: { followerId: session.user.id, followingId: targetId },
  });

  return NextResponse.json({ following: false });
}
