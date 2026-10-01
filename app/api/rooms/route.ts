import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { generateRoomCode } from "@/lib/rooms/code";
import { getGame } from "@/lib/games";

// POST /api/rooms  { gameId: "bingo" }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { gameId } = await req.json();

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
    // Generate a unique code (retry if collision)
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
        status: "lobby",
        players: {
          create: [{ userId: user.id, isHost: true }],
        },
      },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

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