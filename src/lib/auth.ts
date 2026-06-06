import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export interface SessionUser {
  id: string;
  email: string;
  shareDashboard: boolean;
  shareToken: string;
  googleId?: string | null;
  githubId?: string | null;
  microsoftId?: string | null;
  discordId?: string | null;
  facebookId?: string | null;
  hasPassword: boolean;
}

// Get the current user based on session token in cookies
export async function getCurrentUser(request: NextRequest): Promise<SessionUser | null> {
  try {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) return null;

    const session = await db.session.findUnique({
      where: { token: sessionCookie },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            shareDashboard: true,
            shareToken: true,
            googleId: true,
            githubId: true,
            microsoftId: true,
            discordId: true,
            facebookId: true,
            passwordHash: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    const { passwordHash, ...userWithoutHash } = session.user;
    return {
      ...userWithoutHash,
      hasPassword: !!passwordHash,
    };
  } catch (error) {
    console.error("Error getting current user: ", error);
    return null;
  }
}

// Create a session for a user
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  await db.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

// Delete a session
export async function deleteSession(token: string): Promise<void> {
  try {
    await db.session.delete({
      where: { token },
    });
  } catch {
    // Ignore error if session doesn't exist
  }
}
