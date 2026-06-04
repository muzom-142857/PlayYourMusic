import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { ExploreClient } from "./ExploreClient";

type Props = { params: Promise<{ locale: string }> };

export default async function ExplorePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      emoji: true,
      description: true,
      _count: { select: { playlists: true } },
    },
  });

  return (
    <div className="px-4 py-6 lg:px-6">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">{t("explore")}</h1>
      <p className="mb-8 text-muted-foreground text-sm">분위기, 장르, 상황별 플레이리스트를 탐색해보세요</p>
      <ExploreClient categories={categories} />
    </div>
  );
}
