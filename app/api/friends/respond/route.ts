import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/friends/respond  { friendshipId: "uuid", action: "accept" | "decline" }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { friendshipId, action } = await req.json();

  if (!friendshipId || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship || friendship.addresseeId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (action === "accept") {
      const updated = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "accepted" },
      });

      // Notify the original requester
      await prisma.notification.create({
        data: {
          userId: friendship.requesterId,
          actorId: user.id,
          type: "friend_accepted",
          data: { friendshipId: updated.id },
        },
      });

      // Mark the original friend_request notification as read
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          actorId: friendship.requesterId,
          type: "friend_request",
          read: false,
        },
        data: { read: true },
      });

      return NextResponse.json(updated);
    }

    // Decline — just delete the friendship row
    await prisma.friendship.delete({ where: { id: friendshipId } });

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        actorId: friendship.requesterId,
        type: "friend_request",
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/friends/respond error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}