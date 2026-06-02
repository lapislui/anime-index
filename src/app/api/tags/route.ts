import { NextRequest, NextResponse } from "next/server";
import { pb } from "@/lib/db";

export async function GET() {
  try {
    const tags = await pb.collection("tags").getFullList({ sort: "name" });
    
    // Attempt to get count of associated animes for each tag
    let animes: { tags?: string[] }[] = [];
    try {
      animes = await pb.collection("animes").getFullList({ fields: "tags" });
    } catch {
      // If collection doesn't exist yet, ignore
    }

    const mappedTags = tags.map((tag) => {
      const count = animes.filter((a) => a.tags && a.tags.includes(tag.id)).length;
      return {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        _count: { animes: count },
      };
    });

    return NextResponse.json(mappedTags);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;

    const tag = await pb.collection("tags").create({ name, color });

    return NextResponse.json({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

