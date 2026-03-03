import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const media = await db.media.findUnique({ where: { id } });

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

  await db.media.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
