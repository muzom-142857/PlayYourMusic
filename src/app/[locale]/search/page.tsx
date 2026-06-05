export const dynamic = 'force-dynamic';
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { SearchClient } from "./SearchClient";

type Props = { params: Promise<{ locale: string }> };

export default async function SearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, emoji: true },
  });

  return (
    <div className="px-4 py-6 lg:px-6">
      <SearchClient categories={categories} />
    </div>
  );
}
