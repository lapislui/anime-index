import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: collectionId } = await params;
    const body = await request.json();
    const { type, itemIds } = body;

    if (!type || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: "type and a non-empty array of itemIds are required" }, { status: 400 });
    }

    // Ensure user is member
    const member = await db.collectionMember.findFirst({
      where: {
        collectionId,
        userId: user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (type === "anime") {
      // Find all specified items belonging to current user
      const validItems = await db.anime.findMany({
        where: {
          id: { in: itemIds },
          userId: user.id,
        },
        select: { id: true },
      });

      if (validItems.length === 0) {
        return NextResponse.json({ error: "No valid items from your library found to import" }, { status: 400 });
      }

      await db.collection.update({
        where: { id: collectionId },
        data: {
          animes: {
            connect: validItems.map((item) => ({ id: item.id })),
          },
        },
      });
    } else if (type === "game") {
      const validItems = await db.game.findMany({
        where: {
          id: { in: itemIds },
          userId: user.id,
        },
        select: { id: true },
      });

      if (validItems.length === 0) {
        return NextResponse.json({ error: "No valid items from your library found to import" }, { status: 400 });
      }

      await db.collection.update({
        where: { id: collectionId },
        data: {
          games: {
            connect: validItems.map((item) => ({ id: item.id })),
          },
        },
      });
    } else if (type === "movie") {
      const validItems = await db.movie.findMany({
        where: {
          id: { in: itemIds },
          userId: user.id,
        },
        select: { id: true },
      });

      if (validItems.length === 0) {
        return NextResponse.json({ error: "No valid items from your library found to import" }, { status: 400 });
      }

      await db.collection.update({
        where: { id: collectionId },
        data: {
          movies: {
            connect: validItems.map((item) => ({ id: item.id })),
          },
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid type. Must be 'anime', 'game', or 'movie'" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
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

    const { id: collectionId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const itemId = searchParams.get("itemId");

    if (!type || !itemId) {
      return NextResponse.json({ error: "type and itemId parameters are required" }, { status: 400 });
    }

    const collection = await db.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Check membership
    const member = await db.collectionMember.findFirst({
      where: {
        collectionId,
        userId: user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Verify item ownership or collection creator status
    const isCollectionCreator = collection.creatorId === user.id;

    if (type === "anime") {
      const anime = await db.anime.findUnique({ where: { id: itemId } });
      if (!anime) return NextResponse.json({ error: "Item not found" }, { status: 404 });
      
      if (!isCollectionCreator && anime.userId !== user.id) {
        return NextResponse.json({ error: "Not authorized to remove this item" }, { status: 403 });
      }

      await db.collection.update({
        where: { id: collectionId },
        data: {
          animes: {
            disconnect: { id: itemId },
          },
        },
      });
    } else if (type === "game") {
      const game = await db.game.findUnique({ where: { id: itemId } });
      if (!game) return NextResponse.json({ error: "Item not found" }, { status: 404 });

      if (!isCollectionCreator && game.userId !== user.id) {
        return NextResponse.json({ error: "Not authorized to remove this item" }, { status: 403 });
      }

      await db.collection.update({
        where: { id: collectionId },
        data: {
          games: {
            disconnect: { id: itemId },
          },
        },
      });
    } else if (type === "movie") {
      const movie = await db.movie.findUnique({ where: { id: itemId } });
      if (!movie) return NextResponse.json({ error: "Item not found" }, { status: 404 });

      if (!isCollectionCreator && movie.userId !== user.id) {
        return NextResponse.json({ error: "Not authorized to remove this item" }, { status: 403 });
      }

      await db.collection.update({
        where: { id: collectionId },
        data: {
          movies: {
            disconnect: { id: itemId },
          },
        },
      });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
