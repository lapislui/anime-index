import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const user = await db.user.findUnique({
      where: { shareToken: token },
    });

    if (!user || !user.shareDashboard) {
      return NextResponse.json({ error: "Dashboard not found or not shared" }, { status: 404 });
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
      ownerEmail: user.email,
      totalAnime,
      totalEpisodes,
      statusCounts,
      topTags,
      recentActivity,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
