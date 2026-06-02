import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalAnime = await db.anime.count({ where: { userId: user.id } });
    const totalEpisodes = await db.episode.count({
      where: { anime: { userId: user.id } },
    });

    const statusCountsGrouped = await db.anime.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { _all: true },
    });

    const statusCounts = { watching: 0, completed: 0, planned: 0, dropped: 0 };
    statusCountsGrouped.forEach((group) => {
      const status = group.status as keyof typeof statusCounts;
      if (status in statusCounts) statusCounts[status] = group._count._all;
    });

    const topTags = await db.tag.findMany({
      take: 5,
      include: {
        _count: { select: { animes: true } },
      },
      orderBy: { animes: { _count: "desc" } },
    });

    const recentActivity = await db.episode.findMany({
      take: 5,
      where: { anime: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      include: {
        anime: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({
      totalAnime,
      totalEpisodes,
      statusCounts,
      topTags,
      recentActivity,
      shareDashboard: user.shareDashboard,
      shareToken: user.shareToken,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/stats — toggle dashboard sharing
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { shareDashboard } = await request.json();

    await db.user.update({
      where: { id: user.id },
      data: { shareDashboard: !!shareDashboard },
    });

    return NextResponse.json({ success: true, shareDashboard: !!shareDashboard });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
