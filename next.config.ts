import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudflare.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "**.sndcdn.com" },
      { protocol: "https", hostname: "is1-ssl.mzstatic.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
};

async function buildConfig(): Promise<NextConfig> {
  if (process.env.NODE_ENV === "production") {
    const withSerwist = (await import("@serwist/next")).default;
    return withSerwist({
      swSrc: "src/sw.ts",
      swDest: "public/sw.js",
      reloadOnOnline: true,
    })(withNextIntl(baseConfig));
  }
  return withNextIntl(baseConfig);
}

export default buildConfig();
