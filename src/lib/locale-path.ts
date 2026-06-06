/**
 * Constructs a locale-aware URL path.
 * With localePrefix: "as-needed", the default locale (ko) has no URL prefix.
 * Using `/${locale}/xxx` directly generates "/ko/xxx" which 404s for Korean.
 */
export function localePath(locale: string, path: string): string {
  return locale === "ko" ? (path || "/") : `/${locale}${path}`;
}
