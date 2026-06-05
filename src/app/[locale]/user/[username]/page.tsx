export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserProfile } from "./UserProfile";

type Props = { params: Promise<{ locale: string; username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, bio: true, avatarUrl: true },
  });
  if (!user) return {};
  return {
    title: user.name,
    description: user.bio ?? `${user.name}의 플레이리스트`,
    openGraph: {
      title: `${user.name} | PlayYourMusic`,
      description: user.bio ?? `${user.name}의 플레이리스트`,
      images: user.avatarUrl ? [{ url: user.avatarUrl }] : [],
    },
  };
}

export default async function UserPage({ params }: Props) {
  const { locale, username } = await params;
  setRequestLocale(locale);

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

  if (!user) notFound();

  let isFollowing = false;
  if (session?.user?.id && session.user.id !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: session.user.id, followingId: user.id },
      },
    });
    isFollowing = !!follow;
  }

  const playlists = await prisma.playlist.findMany({
    where: { userId: user.id, isPublic: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      tags: { select: { id: true, name: true } },
      categories: { select: { id: true, name: true, slug: true, emoji: true } },
      _count: { select: { tracks: true, comments: true } },
    },
  });

  const serialized = JSON.parse(
    JSON.stringify({
      ...user,
      isFollowing,
      playlists: playlists.map((p) => ({ ...p, isLiked: false })),
    })
  );

  return <UserProfile user={serialized} isOwnProfile={session?.user?.id === user.id} />;
}
