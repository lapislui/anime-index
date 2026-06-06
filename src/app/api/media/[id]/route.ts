import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { Media, GameMedia, MovieMedia } from "@prisma/client";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try to find in anime media
    let media: Media | GameMedia | MovieMedia | null = await db.media.findUnique({
      where: { id },
    });

    let mediaType: "anime" | "game" | "movie" = "anime";
    if (!media) {
      // Try to find in game media
      media = await db.gameMedia.findUnique({
        where: { id },
      });
      mediaType = "game";
    }

    if (!media) {
      // Try to find in movie media
      media = await db.movieMedia.findUnique({
        where: { id },
      });
      mediaType = "movie";
    }

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Delete the file from disk
    try {
      const filepath = path.join(process.cwd(), "public", media.url);
      await unlink(filepath);
    } catch {
      // File may already be deleted, continue
    }

    if (mediaType === "game") {
      await db.gameMedia.delete({
        where: { id },
      });
    } else if (mediaType === "movie") {
      await db.movieMedia.delete({
        where: { id },
      });
    } else {
      await db.media.delete({
        where: { id },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
