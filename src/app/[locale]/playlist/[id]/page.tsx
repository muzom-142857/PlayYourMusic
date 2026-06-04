import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PlaylistDetail } from "./PlaylistDetail";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const playlist = await prisma.playlist.findUnique({
    where: { id, isPublic: true },
    select: {
      title: true,
      description: true,
      coverUrl: true,
      user: { select: { name: true } },
    },
  });

  if (!playlist) return {};

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const ogUrl = `${baseUrl}/api/og?id=${id}`;

  return {
    title: playlist.title,
    description: playlist.description ?? `${playlist.user.name}의 플레이리스트`,
    openGraph: {
      title: playlist.title,
      description: playlist.description ?? `${playlist.user.name}의 플레이리스트`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "music.playlist",
    },
    twitter: {
      card: "summary_large_image",
      title: playlist.title,
      description: playlist.description ?? `${playlist.user.name}의 플레이리스트`,
      images: [ogUrl],
    },
  };
}

export default async function PlaylistPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

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

  if (!playlist) notFound();
  if (!playlist.isPublic && playlist.userId !== session?.user?.id) notFound();

  let isLiked = false;
  if (session?.user?.id) {
    const like = await prisma.playlistLike.findUnique({
      where: { userId_playlistId: { userId: session.user.id, playlistId: id } },
    });
    isLiked = !!like;
  }

  prisma.playlist.update({ where: { id }, data: { playCount: { increment: 1 } } }).catch(() => null);

  const serialized = JSON.parse(JSON.stringify({ ...playlist, isLiked }));

  return <PlaylistDetail playlist={serialized} isOwner={playlist.userId === session?.user?.id} />;
}
