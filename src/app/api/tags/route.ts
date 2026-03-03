import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { animes: true } } },
  });

  return NextResponse.json(tags);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, color } = body;

  const tag = await db.tag.create({
    data: { name, color },
  });

  return NextResponse.json(tag, { status: 201 });
}
