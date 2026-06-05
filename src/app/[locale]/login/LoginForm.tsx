"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

type OAuthProviderId = "google" | "github";

type LoginFormProps = {
  enabledOAuthProviders: Record<OAuthProviderId, boolean>;
};

function sanitizeCallbackUrl(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return fallback;
}

export function LoginForm({ enabledOAuthProviders }: LoginFormProps) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"), `/${locale}`);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: string) => {
    setIsLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      toast.error(t("loginFailed"));
      setIsLoading(null);
    }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading("credentials");
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        toast.error(t("invalidCredentials"));
        setIsLoading(null);
      } else {
        router.refresh();
        router.push(callbackUrl);
      }
    } catch {
      toast.error(t("invalidCredentials"));
      setIsLoading(null);
    }
  };

  const oauthProviders = (
    [
      { id: "google", label: "Google" },
      { id: "github", label: "GitHub" },
    ] satisfies Array<{ id: OAuthProviderId; label: string }>
  ).filter(({ id }) => enabledOAuthProviders[id]);

  return (
    <div className="space-y-4">
      {/* OAuth buttons */}
      {oauthProviders.length > 0 && (
        <>
          <div className="space-y-2">
            {oauthProviders.map(({ id, label }) => (
              <Button
                key={id}
                variant="outline"
                className="w-full"
                onClick={() => handleOAuth(id)}
                disabled={!!isLoading}
              >
                {isLoading === id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("continueWith", { provider: label })}
              </Button>
            ))}
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background text-muted-foreground px-2 text-xs">{t("or")}</span>
            </span>
          </div>
        </>
      )}

      {/* Email / password */}
      <form onSubmit={handleCredentials} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={!!isLoading}>
          {isLoading === "credentials" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("login")}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        {t("noAccount")}{" "}
        <Link
          href={`/${locale}/register`}
          className="text-foreground hover:text-primary underline underline-offset-4"
        >
          {t("registerLink")}
        </Link>
      </p>
    </div>
  );
}
