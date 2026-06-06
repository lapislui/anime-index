import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where: { type?: string } = {};
    if (type) {
      where.type = type;
    }

    const selectCount: { animes?: boolean; games?: boolean; movies?: boolean } = {};
    if (type === "game") {
      selectCount.games = true;
    } else if (type === "movie") {
      selectCount.movies = true;
    } else {
      selectCount.animes = true;
    }

    const tags = await db.tag.findMany({
      where,
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: selectCount,
        },
      },
    });

    return NextResponse.json(tags);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, type } = body;

    const tag = await db.tag.create({
      data: {
        name,
        color: color || undefined,
        type: type || "anime",
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
