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

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "anime";

    if (mode === "movies") {
      const totalMovies = await db.movie.count({ where: { userId: user.id } });
      const totalParts = await db.moviePart.count({
        where: { movie: { userId: user.id } },
      });

      const statusCountsGrouped = await db.movie.groupBy({
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
          _count: { select: { movies: true } },
        },
        orderBy: { movies: { _count: "desc" } },
      });

      const recentActivity = await db.moviePart.findMany({
        take: 5,
        where: { movie: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        include: {
          movie: { select: { id: true, title: true } },
        },
      });

      return NextResponse.json({
        ownerEmail: user.email,
        totalAnime: totalMovies,
        totalEpisodes: totalParts,
        statusCounts,
        topTags: topTags.map(tag => ({
          ...tag,
          _count: { animes: tag._count.movies }
        })),
        recentActivity: recentActivity.map(act => ({
          id: act.id,
          number: act.number,
          title: act.title,
          createdAt: act.createdAt,
          anime: act.movie
        })),
      });
    } else if (mode === "games") {
      const totalGames = await db.game.count({ where: { userId: user.id } });
      const totalChapters = await db.chapter.count({
        where: { game: { userId: user.id } },
      });

      const statusCountsGrouped = await db.game.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: { _all: true },
      });

      const statusCounts = { played: 0, playing: 0, backlog: 0, cant_play: 0 };
      statusCountsGrouped.forEach((group) => {
        const status = group.status as keyof typeof statusCounts;
        if (status in statusCounts) statusCounts[status] = group._count._all;
      });

      const topTags = await db.tag.findMany({
        take: 5,
        include: {
          _count: { select: { games: true } },
        },
        orderBy: { games: { _count: "desc" } },
      });

      const recentActivity = await db.chapter.findMany({
        take: 5,
        where: { game: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        include: {
          game: { select: { id: true, title: true } },
        },
      });

      return NextResponse.json({
        ownerEmail: user.email,
        totalAnime: totalGames,
        totalEpisodes: totalChapters,
        statusCounts,
        topTags: topTags.map(tag => ({
          ...tag,
          _count: { animes: tag._count.games }
        })),
        recentActivity: recentActivity.map(act => ({
          id: act.id,
          number: act.number,
          title: act.title,
          createdAt: act.createdAt,
          anime: act.game
        })),
      });
    }

    // Default: Anime Mode
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
