import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { applyTicTacToeMove } from "@/lib/tictactoe/engine";

// POST /api/rooms/[code]/tictactoe/move  { index: 0..8 }
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
  const { index } = await req.json();

  if (typeof index !== "number" || index < 0 || index > 8) {
    return NextResponse.json({ error: "Invalid cell" }, { status: 400 });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const { state, error } = await applyTicTacToeMove(room.id, user.id, index);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ state });
  } catch (e) {
    console.error("POST tictactoe move error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}