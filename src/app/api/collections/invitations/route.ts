import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invitations = await db.collectionInvitation.findMany({
      where: {
        inviteeId: user.id,
        status: "pending",
      },
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            description: true,
            creator: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invitations);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invitationId, action } = body;

    if (!invitationId || !action || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "invitationId and action ('accept' or 'decline') are required" }, { status: 400 });
    }

    const invitation = await db.collectionInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.inviteeId !== user.id) {
      return NextResponse.json({ error: "Unauthorized. This invitation was sent to another user" }, { status: 403 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "Invitation is already processed" }, { status: 400 });
    }

    if (action === "accept") {
      // Create collection membership and update invitation in a transaction
      await db.$transaction([
        db.collectionMember.create({
          data: {
            collectionId: invitation.collectionId,
            userId: user.id,
            role: "member",
          },
        }),
        db.collectionInvitation.update({
          where: { id: invitationId },
          data: { status: "accepted" },
        }),
      ]);
    } else {
      // Update invitation status to declined
      await db.collectionInvitation.update({
        where: { id: invitationId },
        data: { status: "declined" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
