import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await db.collection.findMany({
      where: {
        members: {
          some: { userId: user.id },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            animes: true,
            games: true,
            movies: true,
          },
        },
      },
    });

    return NextResponse.json(collections);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const collection = await db.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        creatorId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "creator",
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            animes: true,
            games: true,
            movies: true,
          },
        },
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
