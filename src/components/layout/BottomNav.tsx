"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Home, Compass, Search, Library } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "home" as const, href: "/", icon: Home },
  { key: "explore" as const, href: "/explore", icon: Compass },
  { key: "search" as const, href: "/search", icon: Search },
  { key: "library" as const, href: "/library", icon: Library },
];

export function BottomNav() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-md">
      <div className="flex items-center justify-around py-1 safe-area-bottom">
        {navItems.map(({ key, href, icon: Icon }) => {
          const fullHref = `/${locale}${href}`;
          const isActive =
            href === "/"
              ? pathname === `/${locale}` || pathname === `/${locale}/`
              : pathname.startsWith(fullHref);

          return (
            <Link
              key={key}
              href={fullHref}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
