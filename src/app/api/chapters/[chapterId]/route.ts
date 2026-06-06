import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
        media: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    const body = await request.json();
    const { number, title, story } = body;

    const chapter = await db.chapter.update({
      where: { id: chapterId },
      data: {
        number: typeof number === "string" ? parseInt(number, 10) : number,
        title,
        story,
      },
      include: {
        media: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(chapter);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { chapterId } = await params;
    await db.chapter.delete({
      where: { id: chapterId },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
