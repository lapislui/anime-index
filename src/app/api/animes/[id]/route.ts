import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anime = await db.anime.findUnique({
      where: { id },
      include: {
        tags: true,
        episodes: {
          orderBy: {
            number: "asc",
          },
          include: {
            media: {
              orderBy: {
                order: "asc",
              },
            },
          },
        },
      },
    });

    if (!anime) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    return NextResponse.json(anime);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, coverImage, status, tagIds } = body;

    const tagConnections = tagIds && Array.isArray(tagIds)
      ? tagIds.map((id: string) => ({ id }))
      : [];

    const anime = await db.anime.update({
      where: { id },
      data: {
        title,
        description,
        coverImage,
        status,
        tags: {
          set: tagConnections,
        },
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(anime);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.anime.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
