export const dynamic = "force-dynamic";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PlaylistForm } from "@/components/playlist/PlaylistForm";
import { localePath } from "@/lib/locale-path";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function EditPlaylistPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect(localePath(locale, "/login"));

  const [playlist, categories] = await Promise.all([
    prisma.playlist.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, username: true, avatarUrl: true } },
        tags: { select: { id: true, name: true } },
        categories: { select: { id: true, name: true, slug: true, emoji: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, emoji: true },
    }),
  ]);

  if (!playlist) notFound();
  if (playlist.userId !== session.user.id) redirect(localePath(locale, `/playlist/${id}`));

  const serialized = JSON.parse(
    JSON.stringify({ ...playlist, likeCount: 0, playCount: 0, trackCount: 0, isLiked: false })
  );

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">플레이리스트 편집</h1>
      <PlaylistForm playlist={serialized} categories={categories} />
    </div>
  );
}
