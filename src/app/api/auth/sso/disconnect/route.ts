import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const VALID_PROVIDERS = ["google", "github", "microsoft", "discord", "facebook"];

export async function POST(request: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser(request);
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await request.json();
    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: "Invalid provider specified" }, { status: 400 });
    }

    const userDetails = await db.user.findUnique({
      where: { id: loggedInUser.id },
      include: { passkeys: true },
    });

    if (!userDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the provider is actually connected
    const providerIdField = provider + "Id";
    const hasTargetProvider = !!(userDetails as unknown as Record<string, unknown>)[providerIdField];

    if (!hasTargetProvider) {
      return NextResponse.json({ error: "Provider is not connected" }, { status: 400 });
    }

    // Count login methods to prevent lockouts
    let loginMethodsCount = 0;
    if (userDetails.passwordHash) loginMethodsCount++;
    if (userDetails.passkeys && userDetails.passkeys.length > 0) loginMethodsCount++;
    if (userDetails.googleId) loginMethodsCount++;
    if (userDetails.githubId) loginMethodsCount++;
    if (userDetails.microsoftId) loginMethodsCount++;
    if (userDetails.discordId) loginMethodsCount++;
    if (userDetails.facebookId) loginMethodsCount++;

    if (loginMethodsCount <= 1) {
      return NextResponse.json({
        error: "Cannot disconnect the only login method. Please set a password or connect another account first to avoid lockout."
      }, { status: 400 });
    }

    // Perform disconnect
    await db.user.update({
      where: { id: loggedInUser.id },
      data: {
        [providerIdField]: null,
      } as unknown as Prisma.UserUpdateInput,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Disconnect SSO Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
