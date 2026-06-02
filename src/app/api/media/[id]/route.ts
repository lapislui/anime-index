import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { pb } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const media = await pb.collection("medias").getOne(id);

    // Delete the file from disk
    try {
      const filepath = path.join(process.cwd(), "public", media.url);
      await unlink(filepath);
    } catch {
      // File may already be deleted, continue
    }

    await pb.collection("medias").delete(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

