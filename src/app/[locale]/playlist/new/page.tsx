export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PlaylistForm } from "@/components/playlist/PlaylistForm";

type Props = { params: Promise<{ locale: string }> };

export default async function NewPlaylistPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect(`/${locale}/login`);

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, emoji: true },
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">새 플레이리스트</h1>
      <PlaylistForm categories={categories} />
    </div>
  );
}
