"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggle = () => {
    const next = locale === "ko" ? "en" : "ko";
    // Replace current locale prefix in path
    const newPath = pathname.replace(`/${locale}`, `/${next}`);
    router.push(newPath === pathname ? `/${next}` : newPath);
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="text-xs font-medium">
      {locale === "ko" ? "EN" : "한"}
    </Button>
  );
}
