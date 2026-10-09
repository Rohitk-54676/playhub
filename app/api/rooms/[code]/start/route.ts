import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { startBingoGame } from "@/lib/bingo/engine";
import { startDotsGame } from "@/lib/dots/engine";
import { startTicTacToeGame } from "@/lib/tictactoe/engine";

// POST /api/rooms/[code]/start
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
    if (room.status !== "lobby") {
      return NextResponse.json({ error: "Already started" }, { status: 409 });
    }

    if (room.gameId === "tic-tac-toe") {
      if (room.players.length !== 2) {
        return NextResponse.json(
          { error: "Need exactly 2 players" },
          { status: 400 }
        );
      }
      await startTicTacToeGame(room.id);
    } else if (room.gameId === "dots-and-boxes") {
      if (room.players.length < 2) {
        return NextResponse.json(
          { error: "Need at least 2 players" },
          { status: 400 }
        );
      }
      const stateObj = (room.state as { size?: number } | null) ?? {};
      const raw = stateObj.size ?? 5;
      const size = [4, 5, 6, 7, 8].includes(raw) ? raw : 5;
      await startDotsGame(room.id, size);
    } else {
      if (room.players.length < 2) {
        return NextResponse.json(
          { error: "Need at least 2 players" },
          { status: 400 }
        );
      }
      await startBingoGame(room.id);
    }

    return NextResponse.json({ ok: true, status: "playing" });
  } catch (e) {
    console.error("POST start error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}