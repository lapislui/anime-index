import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const malId = searchParams.get("malId");

    if (!malId) {
      return NextResponse.json({ error: "malId is required" }, { status: 400 });
    }

    const res = await fetch(`https://api.malsync.moe/mal/anime/${malId}`);
    if (!res.ok) {
      return NextResponse.json({ Sites: {} });
    }

    const data = await res.json();
    return NextResponse.json({ Sites: data.Sites || {} });
  } catch (error: unknown) {
    console.error("Error in malsync proxy route: ", error);
    return NextResponse.json({ Sites: {} });
  }
}
