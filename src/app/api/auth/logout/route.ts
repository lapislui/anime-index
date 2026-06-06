import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, deleteSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session")?.value;

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      shareDashboard: user.shareDashboard,
      shareToken: user.shareToken,
      googleConnected: !!user.googleId,
      githubConnected: !!user.githubId,
      microsoftConnected: !!user.microsoftId,
      discordConnected: !!user.discordId,
      facebookConnected: !!user.facebookId,
    }
  });
}
