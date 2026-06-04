import { auth } from "@/lib/auth";
import { createPresignedUploadUrl } from "@/lib/r2";
import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";

const requestSchema = z.object({
  folder: z.enum(["covers", "avatars"]),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
  filename: z.string().max(100),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { folder, contentType } = parsed.data;
  const ext = contentType.split("/")[1];
  const key = `${folder}/${session.user.id}/${nanoid()}.${ext}`;

  const uploadUrl = await createPresignedUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key });
}
