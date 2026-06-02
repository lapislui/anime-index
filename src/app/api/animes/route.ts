import { NextRequest, NextResponse } from "next/server";
import { pb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "updatedAt";
    const order = searchParams.get("order") || "desc";
    const search = searchParams.get("search");

    const filterParts: string[] = [];

    if (status) {
      filterParts.push(`status = "${status}"`);
    }
    if (search) {
      filterParts.push(`title ~ "${search}"`);
    }
    if (tag) {
      filterParts.push(`tags.name = "${tag}"`);
    }

    const filter = filterParts.join(" && ");
    
    // Sort mapping: created/updated in pocketbase are 'created' and 'updated'
    let pbSort = sort;
    if (sort === "createdAt") pbSort = "created";
    if (sort === "updatedAt") pbSort = "updated";
    
    const sortParam = (order === "desc" ? "-" : "") + pbSort;

    const options: { expand?: string; sort?: string; filter?: string } = {
      expand: "tags",
      sort: sortParam,
    };

    if (filter) {
      options.filter = filter;
    }

    const records = await pb.collection("animes").getFullList(options);

    // Fetch episodes counts
    let episodes: { anime: string }[] = [];
    try {
      episodes = await pb.collection("episodes").getFullList({ fields: "anime" });
    } catch {
      // ignore
    }

    const animes = records.map((record) => {
      const epCount = episodes.filter((e) => e.anime === record.id).length;
      return {
        id: record.id,
        title: record.title,
        description: record.description,
        coverImage: record.coverImage,
        status: record.status,
        createdAt: record.created,
        updatedAt: record.updated,
        tags: record.expand?.tags
          ? (record.expand.tags as Array<{ id: string; name: string; color: string }>).map((t) => ({
              id: t.id,
              name: t.name,
              color: t.color,
            }))
          : [],
        _count: { episodes: epCount },
      };
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

    const anime = await pb.collection("animes").create({
      title,
      description,
      coverImage,
      status: status || "watching",
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
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

