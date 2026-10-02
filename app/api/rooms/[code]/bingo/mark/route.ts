import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { markCell } from "@/lib/bingo/engine";

// POST /api/rooms/[code]/bingo/mark  { cellIndex: 0..24 }
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
  const { cellIndex } = await req.json();

  if (typeof cellIndex !== "number") {
    return NextResponse.json({ error: "Invalid cell" }, { status: 400 });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const result = await markCell(room.id, user.id, cellIndex);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST mark error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}