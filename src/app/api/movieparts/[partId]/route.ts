import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ partId: string }> }
) {
  try {
    const { partId } = await params;
    const part = await db.moviePart.findUnique({
      where: { id: partId },
      include: {
        movie: {
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

    if (!part) {
      return NextResponse.json({ error: "Movie part not found" }, { status: 404 });
    }

    return NextResponse.json(part);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ partId: string }> }
) {
  try {
    const { partId } = await params;
    const body = await request.json();
    const { number, title, story } = body;

    const part = await db.moviePart.update({
      where: { id: partId },
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

    return NextResponse.json(part);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ partId: string }> }
) {
  try {
    const { partId } = await params;
    await db.moviePart.delete({
      where: { id: partId },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
