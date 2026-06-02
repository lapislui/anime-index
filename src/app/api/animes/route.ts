import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "updatedAt";
    const order = searchParams.get("order") || "desc";
    const search = searchParams.get("search");

    const where: {
      status?: string;
      title?: { contains: string };
      tags?: { some: { name: string } };
    } = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.title = {
        contains: search,
      };
    }
    if (tag) {
      where.tags = {
        some: {
          name: tag,
        },
      };
    }

    const orderParam = order === "asc" ? "asc" : "desc";
    const orderBy: {
      title?: "asc" | "desc";
      createdAt?: "asc" | "desc";
      updatedAt?: "asc" | "desc";
    } = {};
    if (sort === "title") {
      orderBy.title = orderParam;
    } else if (sort === "createdAt") {
      orderBy.createdAt = orderParam;
    } else {
      orderBy.updatedAt = orderParam;
    }

    const animes = await db.anime.findMany({
      where,
      orderBy,
      include: {
        tags: true,
        _count: {
          select: {
            episodes: true,
          },
        },
      },
    });

    return NextResponse.json(animes);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, coverImage, status, tagIds } = body;

    const tagConnections = tagIds && Array.isArray(tagIds)
      ? tagIds.map((id: string) => ({ id }))
      : [];

    const anime = await db.anime.create({
      data: {
        title,
        description,
        coverImage,
        status: status || "watching",
        tags: {
          connect: tagConnections,
        },
      },
      include: {
        tags: true,
      },
    });

    return NextResponse.json(anime, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
