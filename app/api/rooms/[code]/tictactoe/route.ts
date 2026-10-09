import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  loadTicTacToeState,
  restartTicTacToeGame,
} from "@/lib/tictactoe/engine";

// GET /api/rooms/[code]/tictactoe — fetch state
export async function GET(
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
    if (!room.players.some((p) => p.userId === user.id)) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const state = await loadTicTacToeState(room.id);
    if (!state) {
      return NextResponse.json({ error: "No game state" }, { status: 404 });
    }

    return NextResponse.json({
      roomId: room.id,
      roomCode: room.code,
      status: room.status,
      gameState: state,
      amIX: state.xUserId === user.id,
      amIO: state.oUserId === user.id,
    });
  } catch (e) {
    console.error("GET tictactoe error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/rooms/[code]/tictactoe — restart (host only)
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
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (room.hostId !== user.id) {
      return NextResponse.json({ error: "Host only" }, { status: 403 });
    }

    const state = await restartTicTacToeGame(room.id);
    return NextResponse.json({ ok: true, state });
  } catch (e) {
    console.error("POST restart tictactoe error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}