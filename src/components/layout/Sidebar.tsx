"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Home, Compass, Search, Library, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { localePath } from "@/lib/locale-path";

const navItems = [
  { key: "home" as const, href: "/", icon: Home },
  { key: "explore" as const, href: "/explore", icon: Compass },
  { key: "search" as const, href: "/search", icon: Search },
  { key: "library" as const, href: "/library", icon: Library },
];

export function Sidebar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-56 shrink-0 flex-col gap-1 border-r border-border/60 px-3 py-4">
      <nav className="flex flex-col gap-0.5">
        {navItems.map(({ key, href, icon: Icon }) => {
          const fullHref = localePath(locale, href);
          const isActive =
            href === "/"
              ? pathname === localePath(locale, "") || pathname === localePath(locale, "/")
              : pathname.startsWith(fullHref);

          return (
            <Link
              key={key}
              href={fullHref}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(key)}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-border/60 pt-4">
        <Link
          href={localePath(locale, "/playlist/new")}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Plus className="h-4 w-4 shrink-0" />
          {t("createPlaylist")}
        </Link>
      </div>
    </aside>
  );
}
