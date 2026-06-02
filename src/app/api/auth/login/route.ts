import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import crypto from "crypto";

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const [salt, storedHash] = user.passwordHash.split(":");
    const attemptHash = hashPassword(password, salt);

    if (attemptHash !== storedHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSession(user.id);

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
