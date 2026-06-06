"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Search, Plus, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import { signOut, useSession } from "next-auth/react";
import { localePath } from "@/lib/locale-path";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        {/* Logo */}
        <Link href={localePath(locale, "")} className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-base text-foreground">PlayYourMusic</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <Link href={localePath(locale, "/search")}>
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/80 transition-colors">
              <Search className="h-3.5 w-3.5" />
              <span>{t("search")}</span>
            </div>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />

          {session?.user ? (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href={localePath(locale, "/playlist/new")}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("createPlaylist")}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={session.user.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {session.user.name?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={localePath(locale, "/settings")}>
                      <User className="mr-2 h-4 w-4" />
                      {t("settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: localePath(locale, "/login") })}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href={localePath(locale, "/login")}>{t("login")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
