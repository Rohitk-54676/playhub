import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/rooms/code";
import { getGame } from "@/lib/games";
import { generateCard } from "@/lib/bingo/card";
import { BOT_USERNAME } from "@/lib/bingo/ai";

// POST /api/rooms  { gameId, solo?, size? }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { gameId, solo, size } = await req.json();

  const game = getGame(gameId);
  if (!game) {
    return NextResponse.json({ error: "Unknown game" }, { status: 400 });
  }
  if (!game.available) {
    return NextResponse.json(
      { error: "This game isn't available yet" },
      { status: 400 }
    );
  }

  try {
    let code = generateRoomCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.room.findUnique({ where: { code } });
      if (!existing) break;
      code = generateRoomCode();
      attempts++;
    }

    const room = await prisma.room.create({
      data: {
        code,
        gameId,
        hostId: user.id,
        status: solo ? "playing" : "lobby",
        isSolo: !!solo,
                state:
          gameId === "dots-and-boxes"
            ? ({
                size: [4, 5, 6, 7, 8].includes(size) ? size : 5,
              } as object)
            : undefined,
        players: {
          create: [{ userId: user.id, isHost: true }],
        },
      },
    });

    // Solo mode — only for Bingo currently
    if (solo && gameId === "bingo") {
      const bot = await prisma.profile.findUnique({
        where: { username: BOT_USERNAME },
      });
      if (!bot) {
        return NextResponse.json(
          { error: "Bot profile not found. Run seed script." },
          { status: 500 }
        );
      }

      await prisma.roomPlayer.create({
        data: {
          roomId: room.id,
          userId: bot.id,
          isHost: false,
          isBot: true,
        },
      });

      await prisma.bingoCard.createMany({
        data: [
          {
            roomId: room.id,
            userId: user.id,
            numbers: generateCard(),
            marked: [],
            lines: 0,
          },
          {
            roomId: room.id,
            userId: bot.id,
            numbers: generateCard(),
            marked: [],
            lines: 0,
          },
        ],
      });

      await prisma.room.update({
        where: { id: room.id },
        data: {
          state: {
            turnOrder: [user.id, bot.id],
            startedAt: new Date().toISOString(),
          } as object,
        },
      });
    }

    return NextResponse.json({
      id: room.id,
      code: room.code,
      gameId: room.gameId,
      hostId: room.hostId,
      status: room.status,
    });
  } catch (e) {
    console.error("POST /api/rooms error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
