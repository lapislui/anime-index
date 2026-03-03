import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const anime = await db.anime.findUnique({
    where: { id },
    include: {
      tags: true,
      episodes: { orderBy: { number: "asc" }, include: { media: true } },
    },
  });

  if (!anime) {
    return NextResponse.json({ error: "Anime not found" }, { status: 404 });
  }

  return NextResponse.json(anime);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, coverImage, status, tagIds } = body;

  const anime = await db.anime.update({
    where: { id },
    data: {
      title,
      description,
      coverImage,
      status,
      tags: tagIds
        ? { set: tagIds.map((tid: string) => ({ id: tid })) }
        : undefined,
    },
    include: { tags: true },
  });

  return NextResponse.json(anime);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.anime.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
