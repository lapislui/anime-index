import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, createSession } from "@/lib/auth";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";

const RP_NAME = "Anime Index";
const RP_ID = process.env.NEXT_PUBLIC_RP_ID ?? "localhost";
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN ?? "http://localhost:3000";

// Temporary in-memory challenge store (use Redis/DB in production)
const challengeStore = new Map<string, string>();

// POST /api/auth/passkey?action=register-options   — generate registration options
// POST /api/auth/passkey?action=register-verify    — verify registration and store credential
// POST /api/auth/passkey?action=login-options      — generate authentication challenge
// POST /api/auth/passkey?action=login-verify       — verify assertion and create session
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    // ─── REGISTRATION OPTIONS ──────────────────────────────────────────────────
    if (action === "register-options") {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      const existingPasskeys = await db.passkey.findMany({ where: { userId: user.id } });
      const excludeCredentials = existingPasskeys.map((pk) => ({
        id: pk.credentialId,
      }));

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: user.email,
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
      });

      challengeStore.set(`reg:${user.id}`, options.challenge);

      return NextResponse.json(options);
    }

    // ─── REGISTRATION VERIFY ───────────────────────────────────────────────────
    if (action === "register-verify") {
      const user = await getCurrentUser(request);
      if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      const expectedChallenge = challengeStore.get(`reg:${user.id}`);
      if (!expectedChallenge) {
        return NextResponse.json({ error: "No challenge found. Request new options." }, { status: 400 });
      }

      const credential = body as RegistrationResponseJSON;

      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json({ error: "Registration verification failed" }, { status: 400 });
      }

      const { credential: cred } = verification.registrationInfo;

      await db.passkey.create({
        data: {
          credentialId: cred.id,
          publicKey: Buffer.from(cred.publicKey).toString("base64"),
          counter: cred.counter,
          userId: user.id,
        },
      });

      challengeStore.delete(`reg:${user.id}`);

      return NextResponse.json({ success: true });
    }

    // ─── LOGIN OPTIONS ─────────────────────────────────────────────────────────
    if (action === "login-options") {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const user = await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: { passkeys: true },
      });

      if (!user || user.passkeys.length === 0) {
        return NextResponse.json({ error: "No passkeys registered for this account" }, { status: 404 });
      }

      const allowCredentials = user.passkeys.map((pk) => ({ id: pk.credentialId }));

      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials,
        userVerification: "preferred",
      });

      challengeStore.set(`login:${user.id}`, options.challenge);

      return NextResponse.json({ ...options, userId: user.id });
    }

    // ─── LOGIN VERIFY ──────────────────────────────────────────────────────────
    if (action === "login-verify") {
      const { userId, credential } = body as {
        userId: string;
        credential: AuthenticationResponseJSON;
      };

      if (!userId || !credential) {
        return NextResponse.json({ error: "userId and credential are required" }, { status: 400 });
      }

      const expectedChallenge = challengeStore.get(`login:${userId}`);
      if (!expectedChallenge) {
        return NextResponse.json({ error: "No challenge found. Request new options." }, { status: 400 });
      }

      const passkey = await db.passkey.findUnique({
        where: { credentialId: credential.id },
      });

      if (!passkey || passkey.userId !== userId) {
        return NextResponse.json({ error: "Unknown credential" }, { status: 400 });
      }

      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: passkey.credentialId,
          publicKey: Buffer.from(passkey.publicKey, "base64"),
          counter: passkey.counter,
        },
      });

      if (!verification.verified) {
        return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
      }

      // Update counter to prevent replay attacks
      await db.passkey.update({
        where: { id: passkey.id },
        data: { counter: verification.authenticationInfo.newCounter },
      });

      challengeStore.delete(`login:${userId}`);

      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

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

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const passkeys = await db.passkey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        credentialId: true,
        counter: true,
      },
    });

    return NextResponse.json({ passkeys });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Passkey ID is required" }, { status: 400 });
    }

    const passkey = await db.passkey.findFirst({
      where: { id, userId: user.id },
    });

    if (!passkey) {
      return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
    }

    await db.passkey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

