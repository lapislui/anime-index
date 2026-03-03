import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const episodes = await db.episode.findMany({
    where: { animeId: id },
    orderBy: { number: "asc" },
    include: { media: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(episodes);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { number, title, story } = body;

  const episode = await db.episode.create({
    data: {
      number,
      title,
      story,
      animeId: id,
    },
    include: { media: true },
  });

  return NextResponse.json(episode, { status: 201 });
}
