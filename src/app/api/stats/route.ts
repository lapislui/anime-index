import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        where: { type: "movie" },
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
        totalAnime: totalMovies,
        totalEpisodes: totalParts,
        statusCounts,
        topTags: topTags.map(tag => ({
          ...tag,
          _count: { animes: tag._count.movies } // Mapped for uniform dashboard stats usage
        })),
        recentActivity: recentActivity.map(act => ({
          id: act.id,
          number: act.number,
          title: act.title,
          createdAt: act.createdAt,
          anime: act.movie // Mapped for uniform dashboard activity feed
        })),
        shareDashboard: user.shareDashboard,
        shareToken: user.shareToken,
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

      const statusCounts = {
        played: 0,
        playing: 0,
        backlog: 0,
        cant_play: 0,
        planning: 0,
        completed: 0,
        installed: 0,
        dropped: 0,
      };
      statusCountsGrouped.forEach((group) => {
        const status = group.status as keyof typeof statusCounts;
        if (status in statusCounts) statusCounts[status] = group._count._all;
      });

      const topTags = await db.tag.findMany({
        take: 5,
        where: { type: "game" },
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

      // Map field names so Dashboard can read them uniformly
      return NextResponse.json({
        totalAnime: totalGames,
        totalEpisodes: totalChapters,
        statusCounts,
        topTags: topTags.map(tag => ({
          ...tag,
          _count: { animes: tag._count.games } // Mapped for uniform dashboard stats usage
        })),
        recentActivity: recentActivity.map(act => ({
          id: act.id,
          number: act.number,
          title: act.title,
          createdAt: act.createdAt,
          anime: act.game // Mapped for uniform dashboard activity feed
        })),
        shareDashboard: user.shareDashboard,
        shareToken: user.shareToken,
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
      where: { type: "anime" },
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

// PATCH /api/stats — toggle dashboard sharing and selective fields
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const dataToUpdate: {
      shareDashboard?: boolean;
      shareAnime?: boolean;
      shareGames?: boolean;
      shareMovies?: boolean;
      shareActivity?: boolean;
      shareTags?: boolean;
      shareLibrary?: boolean;
    } = {};

    if (body.shareDashboard !== undefined) dataToUpdate.shareDashboard = !!body.shareDashboard;
    if (body.shareAnime !== undefined) dataToUpdate.shareAnime = !!body.shareAnime;
    if (body.shareGames !== undefined) dataToUpdate.shareGames = !!body.shareGames;
    if (body.shareMovies !== undefined) dataToUpdate.shareMovies = !!body.shareMovies;
    if (body.shareActivity !== undefined) dataToUpdate.shareActivity = !!body.shareActivity;
    if (body.shareTags !== undefined) dataToUpdate.shareTags = !!body.shareTags;
    if (body.shareLibrary !== undefined) dataToUpdate.shareLibrary = !!body.shareLibrary;

    const updated = await db.user.update({
      where: { id: user.id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      shareDashboard: updated.shareDashboard,
      shareAnime: updated.shareAnime,
      shareGames: updated.shareGames,
      shareMovies: updated.shareMovies,
      shareActivity: updated.shareActivity,
      shareTags: updated.shareTags,
      shareLibrary: updated.shareLibrary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
