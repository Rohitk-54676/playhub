import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/rooms/[code]/join
export async function POST(
  _req: NextRequest,
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

  try {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
      include: { players: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Already a member — idempotent success
    if (room.players.some((p) => p.userId === user.id)) {
      return NextResponse.json({ id: room.id, alreadyIn: true });
    }

    if (room.status !== "lobby") {
      return NextResponse.json(
        { error: "Game already in progress" },
        { status: 409 }
      );
    }

    // Capacity check
    if (room.players.length >= 10) {
      return NextResponse.json({ error: "Room is full" }, { status: 409 });
    }

    try {
      await prisma.roomPlayer.create({
        data: {
          roomId: room.id,
          userId: user.id,
          isHost: false,
        },
      });
    } catch (e: unknown) {
      // Race condition: someone else inserted between our check and create
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code: string }).code === "P2002"
      ) {
        // Already joined — treat as success
        return NextResponse.json({ id: room.id, alreadyIn: true });
      }
      throw e;
    }

    return NextResponse.json({ id: room.id, joined: true });
  } catch (e) {
    console.error("POST join error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}