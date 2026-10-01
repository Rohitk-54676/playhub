import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/rooms/[code]/start — host-only, starts the game
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

    if (room.hostId !== user.id) {
      return NextResponse.json(
        { error: "Only the host can start" },
        { status: 403 }
      );
    }

    if (room.status !== "lobby") {
      return NextResponse.json({ error: "Already started" }, { status: 409 });
    }

    if (room.players.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 players" },
        { status: 400 }
      );
    }

    const updated = await prisma.room.update({
      where: { id: room.id },
      data: { status: "playing" },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (e) {
    console.error("POST start error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}