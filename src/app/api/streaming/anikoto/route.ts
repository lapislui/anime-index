import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const malId = searchParams.get("malId");

    if (!malId) {
      return NextResponse.json({ error: "malId is required" }, { status: 400 });
    }

    const baseUrl = process.env.ANIKOTO_API_URL || "https://anikotoapi.site";
    const res = await fetch(`${baseUrl}/series/${malId}`);
    
    if (!res.ok) {
      return NextResponse.json({ series: null, episodes: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error in anikoto proxy: ", error);
    return NextResponse.json({ series: null, episodes: [] });
  }
}
