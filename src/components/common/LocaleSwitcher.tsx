"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    router.replace(pathname, { locale: locale === "ko" ? "en" : "ko" });
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="text-xs font-medium">
      {locale === "ko" ? "EN" : "한"}
    </Button>
  );
}
