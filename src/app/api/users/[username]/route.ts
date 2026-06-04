import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(_: Request, { params }: RouteContext) {
  const { username } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          playlists: { where: { isPublic: true } },
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let isFollowing = false;
  if (session?.user?.id && session.user.id !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } },
    });
    isFollowing = !!follow;
  }

  return NextResponse.json({ ...user, isFollowing });
}
