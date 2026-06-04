import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PlaylistDetail } from "./PlaylistDetail";

type Props = { params: Promise<{ locale: string; id: string }> };

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

  // Increment play count
  prisma.playlist.update({ where: { id }, data: { playCount: { increment: 1 } } }).catch(() => null);

  const serialized = JSON.parse(JSON.stringify({ ...playlist, isLiked }));

  return <PlaylistDetail playlist={serialized} isOwner={playlist.userId === session?.user?.id} />;
}
