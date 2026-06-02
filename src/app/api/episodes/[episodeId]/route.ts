import { NextRequest, NextResponse } from "next/server";
import { pb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  try {
    const { episodeId } = await params;
    const episode = await pb.collection("episodes").getOne(episodeId, {
      expand: "anime,medias",
    });

    const formattedEpisode = {
      id: episode.id,
      number: episode.number,
      title: episode.title,
      story: episode.story,
      animeId: episode.anime,
      anime: episode.expand?.anime
        ? {
            id: episode.expand.anime.id,
            title: episode.expand.anime.title,
            coverImage: episode.expand.anime.coverImage,
          }
        : null,
      media: episode.expand?.medias
        ? (episode.expand.medias as Array<{ id: string; url: string; type: string; caption?: string }>).map((m) => ({
            id: m.id,
            url: m.url,
            type: m.type,
            caption: m.caption || null,
          }))
        : [],
    };

    return NextResponse.json(formattedEpisode);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  try {
    const { episodeId } = await params;
    const body = await request.json();
    const { number, title, story } = body;

    const episode = await pb.collection("episodes").update(
      episodeId,
      { number, title, story },
      { expand: "medias" }
    );

    return NextResponse.json({
      id: episode.id,
      number: episode.number,
      title: episode.title,
      story: episode.story,
      animeId: episode.anime,
      media: episode.expand?.medias
        ? (episode.expand.medias as Array<{ id: string; url: string; type: string; caption?: string }>).map((m) => ({
            id: m.id,
            url: m.url,
            type: m.type,
            caption: m.caption || null,
          }))
        : [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  try {
    const { episodeId } = await params;
    await pb.collection("episodes").delete(episodeId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

