import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { loadDotsState, startDotsGame } from "@/lib/dots/engine";
import { enforceDotsTimeout } from "@/lib/dots/timers";

// GET /api/rooms/[code]/dots — fetch current game state
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

    if (room.status === "playing") {
      await enforceDotsTimeout(room.id);
    }

    const state = await loadDotsState(room.id);
    if (!state) {
      return NextResponse.json({ error: "No game state" }, { status: 404 });
    }

    return NextResponse.json({
      roomId: room.id,
      roomCode: room.code,
      status: room.status,
      gameState: state,
    });
  } catch (e) {
    console.error("GET /api/rooms/[code]/dots error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/rooms/[code]/dots — start the game with { size }
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
  const { size } = await req.json();

  if (![4, 5, 6].includes(size)) {
    return NextResponse.json({ error: "Invalid size" }, { status: 400 });
  }

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
    if (room.players.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 players" },
        { status: 400 }
      );
    }

    const state = await startDotsGame(room.id, size);
    return NextResponse.json({ ok: true, state });
  } catch (e) {
    console.error("POST /api/rooms/[code]/dots error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}