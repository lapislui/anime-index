import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: collectionId } = await params;
    const body = await request.json();
    const { inviteeId } = body;

    if (!inviteeId || typeof inviteeId !== "string") {
      return NextResponse.json({ error: "inviteeId is required" }, { status: 400 });
    }

    // 1. Ensure the current user is a member/creator of the collection
    const member = await db.collectionMember.findFirst({
      where: {
        collectionId,
        userId: user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Not authorized to invite to this collection" }, { status: 403 });
    }

    // 2. Ensure the invitee is not already a member
    const existingMember = await db.collectionMember.findFirst({
      where: {
        collectionId,
        userId: inviteeId,
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this collection" }, { status: 400 });
    }

    // 3. Check for existing pending invitation
    const existingInvite = await db.collectionInvitation.findFirst({
      where: {
        collectionId,
        inviteeId,
      },
    });

    if (existingInvite) {
      if (existingInvite.status === "pending") {
        return NextResponse.json({ error: "An invitation is already pending for this user" }, { status: 400 });
      }
      // If they previously declined or accepted, we can delete/reset it
      await db.collectionInvitation.delete({
        where: { id: existingInvite.id },
      });
    }

    // 4. Create the invitation
    const invitation = await db.collectionInvitation.create({
      data: {
        collectionId,
        inviterId: user.id,
        inviteeId,
        status: "pending",
      },
      include: {
        invitee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
