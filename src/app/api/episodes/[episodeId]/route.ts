import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  const { episodeId } = await params;
  const episode = await db.episode.findUnique({
    where: { id: episodeId },
    include: { media: { orderBy: { order: "asc" } }, anime: true },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  return NextResponse.json(episode);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  const { episodeId } = await params;
  const body = await request.json();
  const { number, title, story } = body;

  const episode = await db.episode.update({
    where: { id: episodeId },
    data: { number, title, story },
    include: { media: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(episode);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  const { episodeId } = await params;
  await db.episode.delete({ where: { id: episodeId } });
  return NextResponse.json({ success: true });
}
