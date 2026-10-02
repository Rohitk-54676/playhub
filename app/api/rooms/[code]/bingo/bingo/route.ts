import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBingoClaim } from "@/lib/bingo/engine";
import { completedLines } from "@/lib/bingo/lines";

const LOCKOUT_MS = 30_000;

// POST /api/rooms/[code]/bingo/bingo — declare BINGO!
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

    const card = await prisma.bingoCard.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: user.id } },
    });
    if (!card) {
      return NextResponse.json({ error: "No card" }, { status: 400 });
    }

    // Lockout check
    if (
      card.bingoLockoutUntil &&
      card.bingoLockoutUntil.getTime() > Date.now()
    ) {
      const secs = Math.ceil(
        (card.bingoLockoutUntil.getTime() - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: `Locked out for ${secs}s after a false BINGO` },
        { status: 429 }
      );
    }

    const result = await validateBingoClaim(room.id, user.id);

    if (!result.valid) {
      await prisma.bingoCard.update({
        where: { id: card.id },
        data: { bingoLockoutUntil: new Date(Date.now() + LOCKOUT_MS) },
      });
      return NextResponse.json(
        {
          valid: false,
          lines: result.lines,
          error: `Not enough lines (${result.lines}/5). Locked out for 30s.`,
        },
        { status: 400 }
      );
    }

    const winningLines = completedLines(card.marked);

    await prisma.room.update({
      where: { id: room.id },
      data: {
        status: "finished",
        state: {
          winnerId: user.id,
          winningLines,
          finishedAt: new Date().toISOString(),
        } as object,
      },
    });

    return NextResponse.json({
      valid: true,
      lines: result.lines,
      winningLines,
      winnerId: user.id,
    });
  } catch (e) {
    console.error("POST bingo error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}