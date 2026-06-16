import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids, mode, action, payload } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    if (!["anime", "games", "movies"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    // Determine the Prisma delegate for the requested mode
    let delegate: any;
    if (mode === "anime") {
      delegate = db.anime;
    } else if (mode === "games") {
      delegate = db.game;
    } else if (mode === "movies") {
      delegate = db.movie;
    }

    // Verify ownership of the items to modify
    const items = await delegate.findMany({
      where: {
        id: { in: ids },
        userId: user.id,
      },
      select: { id: true },
    });

    const userItemIds = items.map((item: any) => item.id);
    if (userItemIds.length === 0) {
      return NextResponse.json({ error: "No matching items found for this user" }, { status: 404 });
    }

    if (action === "delete") {
      await delegate.deleteMany({
        where: {
          id: { in: userItemIds },
        },
      });
      return NextResponse.json({ success: true, deletedCount: userItemIds.length });
    } 
    
    if (action === "status") {
      if (!payload || typeof payload !== "string") {
        return NextResponse.json({ error: "Invalid status payload" }, { status: 400 });
      }
      await delegate.updateMany({
        where: {
          id: { in: userItemIds },
        },
        data: {
          status: payload,
        },
      });
      return NextResponse.json({ success: true, updatedCount: userItemIds.length });
    }

    if (action === "add_tags" || action === "remove_tags") {
      if (!payload || !Array.isArray(payload)) {
        return NextResponse.json({ error: "Invalid tags payload" }, { status: 400 });
      }

      // Prisma updateMany doesn't support relation updates (connect/disconnect).
      // We loop through each ID and update its tags.
      const updatePromises = userItemIds.map((id: string) => {
        return delegate.update({
          where: { id },
          data: {
            tags: {
              [action === "add_tags" ? "connect" : "disconnect"]: payload.map((tagId: string) => ({ id: tagId })),
            },
          },
        });
      });

      await Promise.all(updatePromises);
      return NextResponse.json({ success: true, updatedCount: userItemIds.length });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
