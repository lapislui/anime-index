import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const status = searchParams.get("status");
    const format = searchParams.get("format");
    const yearStr = searchParams.get("year");
    const genre = searchParams.get("genre");
    const sort = searchParams.get("sort") || "updatedAt";
    const order = searchParams.get("order") || "desc";
    const search = searchParams.get("search");

    const where: Prisma.MovieWhereInput = { userId: user.id };

    if (status) where.status = status;
    if (format) where.format = format;
    if (yearStr) {
      const year = parseInt(yearStr, 10);
      if (!isNaN(year)) where.year = year;
    }
    if (genre) {
      where.genres = { contains: genre, mode: "insensitive" };
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }
    if (tag) {
      where.tags = { some: { name: tag } };
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

    const movies = await db.movie.findMany({
      where,
      orderBy,
      include: {
        tags: true,
        _count: {
          select: { parts: true },
        },
      },
    });

    return NextResponse.json(movies);
  } catch (error: unknown) {
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
    const { title, description, coverImage, status, year, format, genres, tagIds } = body;

    const tagConnections =
      tagIds && Array.isArray(tagIds) ? tagIds.map((id: string) => ({ id })) : [];

    const movie = await db.movie.create({
      data: {
        title,
        description,
        coverImage,
        status: status || "watching",
        year: year ? parseInt(year, 10) : null,
        format,
        genres,
        userId: user.id,
        tags: {
          connect: tagConnections,
        },
      },
      include: { tags: true },
    });

    return NextResponse.json(movie, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
