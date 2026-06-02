import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import crypto from "crypto";

// POST /api/auth/otp?action=request — Generate OTP and log to console (dev) or send email (prod)
// POST /api/auth/otp?action=verify  — Verify OTP code and create a session
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    if (action === "request") {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Find or create user (OTP allows passwordless sign-in)
      let user = await db.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        user = await db.user.create({ data: { email: normalizedEmail } });
      }

      // Generate 6-digit OTP
      const otpCode = crypto.randomInt(100000, 999999).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await db.user.update({
        where: { id: user.id },
        data: { otpCode, otpExpiresAt },
      });

      // In development, log to console. In production, send via email provider.
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n🔑 OTP for ${normalizedEmail}: ${otpCode} (expires in 10 min)\n`);
      } else {
        // TODO: integrate email provider (e.g. SendGrid, Resend) here
        console.log(`OTP requested for ${normalizedEmail} (email delivery not configured)`);
      }

      return NextResponse.json({ success: true, message: "OTP sent. Check your terminal in development mode." });
    }

    if (action === "verify") {
      const { email, code } = body;
      if (!email || !code) {
        return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await db.user.findUnique({ where: { email: normalizedEmail } });

      if (!user || !user.otpCode || !user.otpExpiresAt) {
        return NextResponse.json({ error: "No OTP requested for this email" }, { status: 400 });
      }

      if (new Date() > user.otpExpiresAt) {
        return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
      }

      if (user.otpCode !== code.trim()) {
        return NextResponse.json({ error: "Invalid OTP code" }, { status: 401 });
      }

      // Clear OTP after successful use
      await db.user.update({
        where: { id: user.id },
        data: { otpCode: null, otpExpiresAt: null },
      });

      const token = await createSession(user.id);

      const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email } });
      response.cookies.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid action. Use ?action=request or ?action=verify" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
