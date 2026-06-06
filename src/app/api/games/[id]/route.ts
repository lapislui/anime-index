import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const game = await db.game.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          { playedWithId: user.id }
        ]
      },
      include: {
        tags: true,
        playedWith: {
          select: { id: true, email: true }
        },
        chapters: {
          orderBy: { number: "asc" },
          include: {
            media: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, coverImage, status, year, format, genres, tagIds, playedWithId } = body;

    // Ensure the game belongs to the current user
    const existing = await db.game.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const tagConnections =
      tagIds && Array.isArray(tagIds) ? tagIds.map((id: string) => ({ id })) : [];

    const game = await db.game.update({
      where: { id },
      data: {
        title,
        description,
        coverImage,
        status,
        year: year ? parseInt(year, 10) : null,
        format,
        genres,
        playedWithId: playedWithId || null,
        tags: { set: tagConnections },
      },
      include: {
        tags: true,
        playedWith: {
          select: { id: true, email: true }
        }
      },
    });

    return NextResponse.json(game);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Ensure the game belongs to the current user
    const existing = await db.game.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    await db.game.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
