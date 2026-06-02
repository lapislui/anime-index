import { NextRequest, NextResponse } from "next/server";
import { pb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const episodes = await pb.collection("episodes").getFullList({
      filter: `anime = "${id}"`,
      sort: "number",
      expand: "medias",
    });

    const formattedEpisodes = episodes.map((ep) => ({
      id: ep.id,
      number: ep.number,
      title: ep.title,
      story: ep.story,
      animeId: ep.anime,
      media: ep.expand?.medias
        ? (ep.expand.medias as Array<{ id: string; url: string; type: string; caption?: string }>).map((m) => ({
            id: m.id,
            url: m.url,
            type: m.type,
            caption: m.caption || null,
          }))
        : [],
    }));

    return NextResponse.json(formattedEpisodes);
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

    const episode = await pb.collection("episodes").create({
      number,
      title,
      story,
      anime: id,
    });

    return NextResponse.json({
      id: episode.id,
      number: episode.number,
      title: episode.title,
      story: episode.story,
      animeId: episode.anime,
      media: [],
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

