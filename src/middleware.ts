import { NextRequest, NextResponse } from "next/server";

// Routes that do NOT require authentication
const PUBLIC_PATHS = [
  "/login",
  "/news",
  "/discover",
  "/shared", // public shared dashboard links
];

// API routes that are always public (auth endpoints)
const PUBLIC_API_PREFIXES = [
  "/api/auth/",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all public API auth routes (login, register, otp, passkey, logout)
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow public page routes (exact match or prefix)
  if (
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  // Allow static files, Next.js internals, and favicon
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie — lightweight edge check (no DB call)
  const session = request.cookies.get("session")?.value;

  if (!session) {
    // Redirect to login, preserving the intended destination
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except static assets handled by Next.js
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
