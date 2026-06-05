"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    // With localePrefix: "as-needed", default locale (ko) has no prefix in the URL
    if (locale === "en") {
      router.push(pathname.replace(/^\/en/, "") || "/");
    } else {
      router.push(`/en${pathname}`);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="text-xs font-medium">
      {locale === "ko" ? "EN" : "한"}
    </Button>
  );
}
