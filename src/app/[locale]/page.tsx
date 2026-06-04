import { setRequestLocale, getTranslations } from "next-intl/server";
import { HomeFeed } from "./HomeFeed";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div className="px-4 py-6 lg:px-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{t("trending")}</h1>
      <HomeFeed />
    </div>
  );
}
