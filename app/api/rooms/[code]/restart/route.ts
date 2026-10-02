import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { startBingoGame } from "@/lib/bingo/engine";

// POST /api/rooms/[code]/restart — host-only, resets the game
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
      return NextResponse.json({ error: "Host only" }, { status: 403 });
    }

    // Wipe cards + picks, then start fresh
    await prisma.bingoPick.deleteMany({ where: { roomId: room.id } });
    await prisma.bingoCard.deleteMany({ where: { roomId: room.id } });

    await startBingoGame(room.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST restart error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}