"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function LoginForm() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? `/${locale}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: string) => {
    setIsLoading(provider);
    await signIn(provider, { callbackUrl });
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading("credentials");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (res?.error) {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
      setIsLoading(null);
    } else {
      router.push(callbackUrl);
    }
  };

  const oauthProviders = [
    { id: "google", label: "Google" },
    { id: "spotify", label: "Spotify" },
    { id: "github", label: "GitHub" },
    { id: "apple", label: "Apple" },
  ];

  return (
    <div className="space-y-4">
      {/* OAuth buttons */}
      <div className="space-y-2">
        {oauthProviders.map(({ id, label }) => (
          <Button
            key={id}
            variant="outline"
            className="w-full"
            onClick={() => handleOAuth(id)}
            disabled={!!isLoading}
          >
            {isLoading === id ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {label}로 계속하기
          </Button>
        ))}
      </div>

      <div className="relative">
        <Separator />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="bg-background px-2 text-xs text-muted-foreground">또는</span>
        </span>
      </div>

      {/* Email / password */}
      <form onSubmit={handleCredentials} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email">이메일</Label>
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
          <Label htmlFor="password">비밀번호</Label>
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
          로그인
        </Button>
      </form>
    </div>
  );
}
