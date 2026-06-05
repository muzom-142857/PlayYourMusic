export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

type Props = { params: Promise<{ locale: string }> };

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user) redirect(`/${locale}`);

  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">PlayYourMusic</h1>
          <p className="text-muted-foreground text-sm">{t("login")}</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
