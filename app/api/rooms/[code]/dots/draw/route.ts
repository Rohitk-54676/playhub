import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { applyDraw } from "@/lib/dots/engine";

// POST /api/rooms/[code]/dots/draw  { type: "h" | "v", index }
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
  const { type, index } = await req.json();

  if (type !== "h" && type !== "v") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (typeof index !== "number") {
    return NextResponse.json({ error: "Invalid index" }, { status: 400 });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const { state, error } = await applyDraw(room.id, user.id, type, index);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ state });
  } catch (e) {
    console.error("POST draw error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}