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
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { shareToken: token },
    });

    if (!user || !user.shareDashboard) {
      return NextResponse.json({ error: "Dashboard not found or not shared" }, { status: 404 });
    }

    if (!user.shareLibrary) {
      return NextResponse.json({ error: "Library is private" }, { status: 403 });
    }

    if (mode === "anime" && !user.shareAnime) {
      return NextResponse.json({ error: "Anime details are private" }, { status: 403 });
    }
    if (mode === "games" && !user.shareGames) {
      return NextResponse.json({ error: "Gaming details are private" }, { status: 403 });
    }
    if (mode === "movies" && !user.shareMovies) {
      return NextResponse.json({ error: "Movie details are private" }, { status: 403 });
    }

    if (mode === "movies") {
      const movie = await db.movie.findFirst({
        where: { id: itemId, userId: user.id },
        include: {
          tags: true,
          parts: {
            include: { media: true },
            orderBy: { number: "asc" },
          },
        },
      });
      if (!movie) return NextResponse.json({ error: "Movie not found" }, { status: 404 });
      return NextResponse.json(movie);
    } else if (mode === "games") {
      const game = await db.game.findFirst({
        where: {
          id: itemId,
          OR: [
            { userId: user.id },
            { playedWithId: user.id }
          ]
        },
        include: {
          tags: true,
          playedWith: {
            select: { id: true, email: true }
          },
          chapters: {
            include: { media: true },
            orderBy: { number: "asc" },
          },
        },
      });
      if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
      return NextResponse.json(game);
    }

    // Default: Anime
    const anime = await db.anime.findFirst({
      where: { id: itemId, userId: user.id },
      include: {
        tags: true,
        episodes: {
          include: { media: true },
          orderBy: { number: "asc" },
        },
      },
    });
    if (!anime) return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    return NextResponse.json(anime);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
