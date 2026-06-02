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

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = `${salt}:${hashPassword(password, salt)}`;

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
      },
    });

    const token = await createSession(user.id);

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email } }, { status: 201 });
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
