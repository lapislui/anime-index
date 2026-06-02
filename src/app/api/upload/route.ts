import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const episodeId = formData.get("episodeId") as string | null;
    const type = formData.get("type") as string | null; // "image" or "clip"
    const caption = formData.get("caption") as string | null;

    if (!file || !episodeId || !type) {
      return NextResponse.json(
        { error: "file, episodeId, and type are required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", type === "clip" ? "clips" : "images");
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/${type === "clip" ? "clips" : "images"}/${filename}`;

    // Get the current max order for this episode's media
    let order = 0;
    try {
      const lastMedia = await db.media.findFirst({
        where: { episodeId },
        orderBy: { order: "desc" },
      });
      if (lastMedia) {
        order = lastMedia.order + 1;
      }
    } catch {
      // ignore
    }

    const media = await db.media.create({
      data: {
        url,
        type,
        caption,
        order,
        episodeId,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
