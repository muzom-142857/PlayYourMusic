import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Providers } from "@/components/common/Providers";
import { ColorThemeProvider } from "@/components/common/ColorThemeProvider";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { GlobalPlayer } from "@/components/player/GlobalPlayer";
import { PageTransition } from "@/components/common/PageTransition";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <ColorThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 min-w-0 pb-32 lg:pb-24">
                <PageTransition>{children}</PageTransition>
              </main>
            </div>
          </div>
          <GlobalPlayer />
          <BottomNav />
        </ColorThemeProvider>
      </Providers>
    </NextIntlClientProvider>
  );
}
