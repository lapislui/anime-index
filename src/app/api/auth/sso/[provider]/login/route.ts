import { NextRequest, NextResponse } from "next/server";
import { ssoProviders } from "@/lib/sso";
import crypto from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerId } = await params;
  const provider = ssoProviders[providerId];

  if (!provider || !provider.clientId || !provider.clientSecret) {
    return NextResponse.json({ error: `SSO Provider ${providerId} is not configured` }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_ORIGIN || request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/sso/${providerId}/callback`;

  // CSRF State Protection
  const state = crypto.randomBytes(16).toString("hex");

  const authUrl = new URL(provider.authUrl);
  authUrl.searchParams.set("client_id", provider.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", provider.scopes);
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());

  // Store state cookie
  response.cookies.set("sso_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
