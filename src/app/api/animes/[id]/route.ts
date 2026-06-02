import { NextRequest, NextResponse } from "next/server";
import { pb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const anime = await pb.collection("animes").getOne(id, {
      expand: "tags",
    });

    let episodes: Array<{
      id: string;
      number: number;
      title: string;
      story: string;
      anime: string;
      expand?: {
        medias?: Array<{
          id: string;
          url: string;
          type: string;
          caption?: string;
        }>;
      };
    }> = [];
    try {
      episodes = await pb.collection("episodes").getFullList({
        filter: `anime = "${id}"`,
        sort: "number",
        expand: "medias",
      });
    } catch {
      // ignore
    }

    const formattedAnime = {
      id: anime.id,
      title: anime.title,
      description: anime.description,
      coverImage: anime.coverImage,
      status: anime.status,
      createdAt: anime.created,
      updatedAt: anime.updated,
      tags: anime.expand?.tags
        ? (anime.expand.tags as Array<{ id: string; name: string; color: string }>).map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
          }))
        : [],
      episodes: episodes.map((ep) => ({
        id: ep.id,
        number: ep.number,
        title: ep.title,
        story: ep.story,
        media: ep.expand?.medias
          ? (ep.expand.medias as Array<{ id: string; url: string; type: string; caption?: string }>).map((m) => ({
              id: m.id,
              url: m.url,
              type: m.type,
              caption: m.caption || null,
            }))
          : [],
      })),
    };

    return NextResponse.json(formattedAnime);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, coverImage, status, tagIds } = body;

    const anime = await pb.collection("animes").update(id, {
      title,
      description,
      coverImage,
      status,
      tags: tagIds || [],
    }, {
      expand: "tags",
    });

    return NextResponse.json({
      id: anime.id,
      title: anime.title,
      description: anime.description,
      coverImage: anime.coverImage,
      status: anime.status,
      createdAt: anime.created,
      updatedAt: anime.updated,
      tags: anime.expand?.tags
        ? (anime.expand.tags as Array<{ id: string; name: string; color: string }>).map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await pb.collection("animes").delete(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

