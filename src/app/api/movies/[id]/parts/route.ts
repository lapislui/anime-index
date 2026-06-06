import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parts = await db.moviePart.findMany({
      where: { movieId: id },
      orderBy: { number: "asc" },
      include: {
        media: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(parts);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { number, title, story } = body;

    const part = await db.moviePart.create({
      data: {
        number: typeof number === "string" ? parseInt(number, 10) : number,
        title,
        story,
        movieId: id,
      },
      include: {
        media: true,
      },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
