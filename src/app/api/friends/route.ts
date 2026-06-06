import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch users followed by the current user
    const followingList = await db.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: {
            id: true,
            email: true,
            shareDashboard: true,
            shareToken: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch users following the current user
    const followersList = await db.follow.findMany({
      where: { followingId: user.id },
      include: {
        follower: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      following: followingList.map((f) => ({
        id: f.id,
        userId: f.following.id,
        email: f.following.email,
        shareDashboard: f.following.shareDashboard,
        shareToken: f.following.shareToken,
      })),
      followers: followersList.map((f) => ({
        id: f.id,
        userId: f.follower.id,
        email: f.follower.email,
      })),
    });
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

    const { target } = await request.json();
    if (!target) {
      return NextResponse.json({ error: "Email or Share Token is required" }, { status: 400 });
    }

    const cleanTarget = target.toLowerCase().trim();

    // Find target user by email or shareToken
    const targetUser = await db.user.findFirst({
      where: {
        OR: [
          { email: cleanTarget },
          { shareToken: target.trim() },
        ],
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    // Check if already following
    const existing = await db.follow.findFirst({
      where: {
        followerId: user.id,
        followingId: targetUser.id,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "You are already following this user" }, { status: 400 });
    }

    await db.follow.create({
      data: {
        followerId: user.id,
        followingId: targetUser.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const followingId = searchParams.get("followingId");

    if (!followingId) {
      return NextResponse.json({ error: "Following user ID is required" }, { status: 400 });
    }

    await db.follow.deleteMany({
      where: {
        followerId: user.id,
        followingId: followingId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
