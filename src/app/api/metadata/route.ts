import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchTrackMetadata } from "@/lib/metadata-fetcher";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const meta = await fetchTrackMetadata(url);
    return NextResponse.json(meta);
  } catch {
    return NextResponse.json({ error: "Failed to fetch metadata" }, { status: 502 });
  }
}
