import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Enable locale routing for all paths except API, _next, and static files
    "/((?!api|_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest).*)",
  ],
};
