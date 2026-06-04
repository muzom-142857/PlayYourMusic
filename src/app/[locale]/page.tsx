import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold tracking-tight">PlayYourMusic</h1>
      <p className="text-muted-foreground text-lg">{t("trending")}</p>
      <p className="text-sm text-muted-foreground">Phase 1 setup complete ✓</p>
    </main>
  );
}
