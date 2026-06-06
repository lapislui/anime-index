import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const followingToken = searchParams.get("followingToken");

    if (!followingToken) {
      return NextResponse.json({ error: "followingToken query parameter is required" }, { status: 400 });
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ loggedIn: false, isSelf: false, isFollowing: false });
    }

    const targetUser = await db.user.findUnique({
      where: { shareToken: followingToken },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return NextResponse.json({ loggedIn: true, isSelf: true, isFollowing: false });
    }

    const follow = await db.follow.findFirst({
      where: {
        followerId: user.id,
        followingId: targetUser.id,
      },
    });

    return NextResponse.json({
      loggedIn: true,
      isSelf: false,
      isFollowing: !!follow,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
