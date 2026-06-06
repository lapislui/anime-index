import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "anime";

    const user = await db.user.findUnique({
      where: { shareToken: token },
    });

    if (!user || !user.shareDashboard) {
      return NextResponse.json({ error: "Dashboard not found or not shared" }, { status: 404 });
    }

    if (mode === "movies") {
      const movies = await db.movie.findMany({
        where: { userId: user.id },
        include: {
          tags: true,
          _count: { select: { parts: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
      return NextResponse.json(movies);
    } else if (mode === "games") {
      const games = await db.game.findMany({
        where: { userId: user.id },
        include: {
          tags: true,
          _count: { select: { chapters: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
      return NextResponse.json(games);
    }

    // Default: Anime
    const animes = await db.anime.findMany({
      where: { userId: user.id },
      include: {
        tags: true,
        _count: { select: { episodes: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(animes);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
