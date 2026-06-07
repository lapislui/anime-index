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
    const movie = await db.movie.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          {
            collections: {
              some: {
                members: {
                  some: { userId: user.id },
                },
              },
            },
          },
        ],
      },
      include: {
        tags: true,
        parts: {
          orderBy: { number: "asc" },
          include: {
            media: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json(movie);
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
    const { title, description, coverImage, status, year, format, genres, tagIds } = body;

    // Ensure the movie belongs to the current user
    const existing = await db.movie.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const tagConnections =
      tagIds && Array.isArray(tagIds) ? tagIds.map((id: string) => ({ id })) : [];

    const movie = await db.movie.update({
      where: { id },
      data: {
        title,
        description,
        coverImage,
        status,
        year: year ? parseInt(year, 10) : null,
        format,
        genres,
        tags: { set: tagConnections },
      },
      include: { tags: true },
    });

    return NextResponse.json(movie);
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

    // Ensure the movie belongs to the current user
    const existing = await db.movie.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    await db.movie.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
