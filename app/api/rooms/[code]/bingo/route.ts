import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { loadState } from "@/lib/bingo/engine";
import { enforcePickTimeout } from "@/lib/bingo/timers";
import { maybeTakeBotTurn } from "@/lib/bingo/bot";

const BOT_DELAY_MS = 1500;

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
      include: { players: { orderBy: { joinedAt: "asc" } } },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (!room.players.some((p) => p.userId === user.id)) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    if (room.status === "playing") {
      // Bot turn? Take it if enough time has passed since last move
      const lastPick = await prisma.bingoPick.findFirst({
        where: { roomId: room.id },
        orderBy: { createdAt: "desc" },
      });
      const turnOrder = room.players.map((p) => p.userId);
      const pickCount = await prisma.bingoPick.count({
        where: { roomId: room.id },
      });
      const currentIdx = pickCount % Math.max(turnOrder.length, 1);
      const currentUserId = turnOrder[currentIdx];
      const currentPlayer = room.players.find(
        (p) => p.userId === currentUserId
      );

      if (currentPlayer?.isBot) {
        const lastTime = lastPick
          ? lastPick.createdAt.getTime()
          : room.createdAt.getTime();
        if (Date.now() - lastTime >= BOT_DELAY_MS) {
          await maybeTakeBotTurn(room.id);
        }
      } else {
        // Human turn — enforce 15s timeout
        await enforcePickTimeout(room.id);
      }
    }

    const state = await loadState(room.id);
    if (!state) {
      return NextResponse.json({ error: "No game state" }, { status: 404 });
    }

    const myCard = await prisma.bingoCard.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: user.id } },
    });

    return NextResponse.json({
      roomId: room.id,
      roomCode: room.code,
      status: room.status,
      isSolo: room.isSolo,
      gameState: state,
      myCard: myCard
        ? {
            numbers: myCard.numbers,
            marked: myCard.marked,
            lines: myCard.lines,
            bingoLockoutUntil:
              myCard.bingoLockoutUntil?.toISOString() ?? null,
          }
        : null,
    });
  } catch (e) {
    console.error("GET /api/rooms/[code]/bingo error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}