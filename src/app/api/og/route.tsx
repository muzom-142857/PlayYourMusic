export const dynamic = "force-dynamic";
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Default OG image
  if (!id) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ fontSize: 64, color: "#ffffff", fontWeight: 800, letterSpacing: "-2px" }}>
            PlayYourMusic
          </div>
          <div style={{ fontSize: 24, color: "#888", marginTop: 16 }}>
            Share &amp; discover curated playlists
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id, isPublic: true },
    select: {
      title: true,
      description: true,
      coverUrl: true,
      trackCount: true,
      likeCount: true,
      user: { select: { name: true, avatarUrl: true } },
      categories: { select: { name: true, emoji: true }, take: 3 },
    },
  });

  if (!playlist) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "60px",
          fontFamily: "sans-serif",
          gap: "48px",
          alignItems: "center",
        }}
      >
        {/* Cover */}
        <div
          style={{
            width: 320,
            height: 320,
            borderRadius: 20,
            overflow: "hidden",
            flexShrink: 0,
            background: "#1e1e2e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}
        >
          {playlist.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={playlist.coverUrl} width={320} height={320} style={{ objectFit: "cover" }} alt="" />
          ) : (
            <div style={{ fontSize: 80, color: "#444" }}>♪</div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
          {/* Categories */}
          {playlist.categories.length > 0 && (
            <div style={{ display: "flex", gap: 8 }}>
              {playlist.categories.map((c) => (
                <div
                  key={c.name}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: 14,
                    color: "#ccc",
                  }}
                >
                  {c.emoji} {c.name}
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-1px",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
            }}
          >
            {playlist.title}
          </div>

          {/* Description */}
          {playlist.description && (
            <div
              style={{
                fontSize: 20,
                color: "#888",
                lineHeight: 1.5,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
              }}
            >
              {playlist.description}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: 24, color: "#666", fontSize: 18, marginTop: 4 }}>
            <span>🎵 {playlist.trackCount} tracks</span>
            <span>❤️ {playlist.likeCount} likes</span>
          </div>

          {/* Creator */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
            {playlist.user.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={playlist.user.avatarUrl}
                width={40}
                height={40}
                style={{ borderRadius: "50%" }}
                alt=""
              />
            )}
            <span style={{ fontSize: 18, color: "#aaa" }}>{playlist.user.name}</span>
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 48,
            fontSize: 18,
            color: "#444",
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          PlayYourMusic
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
