import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/rooms/[code]/invite  { targetUserId }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { code } = await params;
  const { targetUserId } = await req.json();

  if (!targetUserId) {
    return NextResponse.json({ error: "Missing target" }, { status: 400 });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Only members can invite
    const membership = await prisma.roomPlayer.findUnique({
      where: {
        roomId_userId: { roomId: room.id, userId: user.id },
      },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "You're not in this room" },
        { status: 403 }
      );
    }

    // Check target exists
    const target = await prisma.profile.findUnique({
      where: { id: targetUserId },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already in the room
    const alreadyIn = await prisma.roomPlayer.findUnique({
      where: {
        roomId_userId: { roomId: room.id, userId: targetUserId },
      },
    });
    if (alreadyIn) {
      return NextResponse.json({ error: "Already in room" }, { status: 409 });
    }

    // Create notification (deduplicate: skip if unread invite to same room exists)
    const existing = await prisma.notification.findFirst({
      where: {
        userId: targetUserId,
        actorId: user.id,
        type: "room_invite",
        read: false,
        data: { path: ["roomCode"], equals: room.code },
      },
    });

    if (existing) {
      return NextResponse.json({ already: true });
    }

    await prisma.notification.create({
      data: {
        userId: targetUserId,
        actorId: user.id,
        type: "room_invite",
        data: {
          roomCode: room.code,
          roomId: room.id,
          gameId: room.gameId,
          invitedByName: user.user_metadata?.username ?? "Someone",
        } as object,
      },
    });

    return NextResponse.json({ sent: true });
  } catch (e) {
    console.error("POST invite error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}