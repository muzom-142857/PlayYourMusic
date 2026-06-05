export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";

type Props = { params: Promise<{ locale: string }> };

export default async function LibraryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const t = await getTranslations("nav");

  const playlists = await prisma.playlist.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { id: true, name: true, username: true, avatarUrl: true } },
      tags: { select: { id: true, name: true } },
      categories: { select: { id: true, name: true, slug: true, emoji: true } },
      _count: { select: { tracks: true, comments: true } },
    },
  });

  const serialized = JSON.parse(JSON.stringify(playlists.map((p) => ({ ...p, isLiked: false }))));

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("library")}</h1>
        <Button asChild size="sm">
          <Link href={`/${locale}/playlist/new`}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            새 플레이리스트
          </Link>
        </Button>
      </div>

      {serialized.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-muted-foreground">
          <p className="text-sm">아직 만든 플레이리스트가 없습니다.</p>
          <Button asChild>
            <Link href={`/${locale}/playlist/new`}>첫 번째 플레이리스트 만들기</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {serialized.map((pl: (typeof serialized)[number]) => (
            <PlaylistCard key={pl.id} playlist={pl} />
          ))}
        </div>
      )}
    </div>
  );
}
