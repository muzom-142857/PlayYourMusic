import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchTrackMetadata } from "@/lib/metadata-fetcher";
import { z } from "zod";

const addTrackSchema = z.object({
  playlistId: z.string(),
  sourceUrl: z.string().url(),
  // Optional overrides (user can edit after auto-fetch)
  title: z.string().min(1).max(200).optional(),
  artist: z.string().max(100).optional(),
});

const reorderSchema = z.object({
  playlistId: z.string(),
  orderedIds: z.array(z.string()),
});

/** POST /api/tracks — add a track to a playlist */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const bodyObj = body as Record<string, unknown>;

  // Handle reorder action
  if (bodyObj.action === "reorder") {
    const parsed = reorderSchema.safeParse(bodyObj);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const { playlistId, orderedIds } = parsed.data;
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      select: { userId: true, tracks: { select: { id: true } } },
    });
    if (!playlist || playlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Reject any track IDs not belonging to this playlist (IDOR guard)
    const ownedIds = new Set(playlist.tracks.map((t) => t.id));
    if (orderedIds.some((id) => !ownedIds.has(id))) {
      return NextResponse.json({ error: "Invalid track IDs" }, { status: 400 });
    }

    await prisma.$transaction(
      orderedIds.map((trackId, i) =>
        prisma.track.update({ where: { id: trackId, playlistId }, data: { position: i } })
      )
    );
    return NextResponse.json({ ok: true });
  }

  // Add track
  const parsed = addTrackSchema.safeParse(bodyObj);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { playlistId, sourceUrl, title: overrideTitle, artist: overrideArtist } = parsed.data;

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { userId: true, _count: { select: { tracks: true } } },
  });
  if (!playlist || playlist.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const meta = await fetchTrackMetadata(sourceUrl);

  const [track] = await prisma.$transaction([
    prisma.track.create({
      data: {
        title: overrideTitle ?? meta.title,
        artist: overrideArtist ?? meta.artist,
        duration: meta.duration,
        sourceUrl,
        sourcePlatform: meta.sourcePlatform,
        thumbnailUrl: meta.thumbnailUrl,
        position: playlist._count.tracks,
        playlistId,
      },
    }),
    prisma.playlist.update({
      where: { id: playlistId },
      data: { trackCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json(track, { status: 201 });
}

/** DELETE /api/tracks?id=<trackId> */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get("id");
  if (!trackId) return NextResponse.json({ error: "Missing track id" }, { status: 400 });

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: { playlist: { select: { userId: true } } },
  });
  if (!track || track.playlist.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.track.delete({ where: { id: trackId } }),
    prisma.playlist.update({
      where: { id: track.playlistId },
      data: { trackCount: { decrement: 1 } },
    }),
  ]);

  return new NextResponse(null, { status: 204 });
}
