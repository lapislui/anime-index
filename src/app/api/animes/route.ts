import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const status = searchParams.get("status");
  const sort = searchParams.get("sort") || "updatedAt";
  const order = searchParams.get("order") || "desc";
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};

  if (tag) {
    where.tags = { some: { name: tag } };
  }
  if (status) {
    where.status = status;
  }
  if (search) {
    where.title = { contains: search };
  }

  const animes = await db.anime.findMany({
    where,
    include: { tags: true, _count: { select: { episodes: true } } },
    orderBy: { [sort]: order },
  });

  return NextResponse.json(animes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, coverImage, status, tagIds } = body;

  const anime = await db.anime.create({
    data: {
      title,
      description,
      coverImage,
      status: status || "watching",
      tags: tagIds?.length
        ? { connect: tagIds.map((id: string) => ({ id })) }
        : undefined,
    },
    include: { tags: true },
  });

  return NextResponse.json(anime, { status: 201 });
}
