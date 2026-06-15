import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = path.join(process.cwd(), "nexus-library.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "nexus-library.json file not found in root directory" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const games = JSON.parse(fileContent);

    return NextResponse.json({ games });
  } catch (error: unknown) {
    console.error("Failed to read local library file:", error);
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

    const body = await request.json();
    const { games } = body;

    if (!games || !Array.isArray(games)) {
      return NextResponse.json({ error: "Invalid request payload. Expected an array of games under 'games'." }, { status: 400 });
    }

    let importedCount = 0;
    let updatedCount = 0;

    // Run imports in a transaction or sequential operations
    for (const gameData of games) {
      const { title, description, coverImage, status, year, format, genres } = gameData;
      if (!title || !title.trim()) continue;

      const trimmedTitle = title.trim();

      // Check if a game with this title already exists for this user
      const existingGame = await db.game.findFirst({
        where: {
          userId: user.id,
          title: {
            equals: trimmedTitle,
            mode: "insensitive",
          },
        },
      });

      const parsedYear = year ? parseInt(year, 10) : null;

      if (existingGame) {
        // Update the existing game
        await db.game.update({
          where: { id: existingGame.id },
          data: {
            description: description ?? existingGame.description,
            coverImage: coverImage ?? existingGame.coverImage,
            status: status ?? existingGame.status,
            year: !isNaN(Number(parsedYear)) && parsedYear !== null ? parsedYear : existingGame.year,
            format: format ?? existingGame.format,
            genres: genres ?? existingGame.genres,
          },
        });
        updatedCount++;
      } else {
        // Create new game
        await db.game.create({
          data: {
            title: trimmedTitle,
            description: description || null,
            coverImage: coverImage || null,
            status: status || "backlog",
            year: !isNaN(Number(parsedYear)) && parsedYear !== null ? parsedYear : null,
            format: format || null,
            genres: genres || null,
            userId: user.id,
          },
        });
        importedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      updatedCount,
      totalProcessed: importedCount + updatedCount,
    });
  } catch (error: unknown) {
    console.error("Bulk import failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
