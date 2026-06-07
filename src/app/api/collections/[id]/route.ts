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

    // Check membership
    const member = await db.collectionMember.findFirst({
      where: {
        collectionId: id,
        userId: user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Not a member of this collection" }, { status: 403 });
    }

    const collection = await db.collection.findUnique({
      where: { id },
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
        animes: {
          include: {
            tags: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            _count: {
              select: { episodes: true },
            },
          },
        },
        games: {
          include: {
            tags: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            _count: {
              select: { chapters: true },
            },
          },
        },
        movies: {
          include: {
            tags: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            _count: {
              select: { parts: true },
            },
          },
        },
        invitations: {
          where: {
            status: "pending",
          },
          include: {
            invitee: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json(collection);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
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
    const { name, description } = body;

    const collection = await db.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.creatorId !== user.id) {
      return NextResponse.json({ error: "Only the creator can edit this collection" }, { status: 403 });
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return NextResponse.json({ error: "Collection name cannot be empty" }, { status: 400 });
    }

    const updated = await db.collection.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? (description?.trim() || null) : undefined,
      },
    });

    return NextResponse.json(updated);
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

    const collection = await db.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    if (collection.creatorId !== user.id) {
      // Check if user is a member to allow them to leave
      const member = await db.collectionMember.findUnique({
        where: {
          collectionId_userId: {
            collectionId: id,
            userId: user.id,
          },
        },
      });

      if (!member) {
        return NextResponse.json({ error: "Not authorized to delete or leave this collection" }, { status: 403 });
      }

      await db.collectionMember.delete({
        where: {
          collectionId_userId: {
            collectionId: id,
            userId: user.id,
          },
        },
      });

      return NextResponse.json({ success: true, left: true });
    }

    await db.collection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
