import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { loadDotsState } from "@/lib/dots/engine";

// POST /api/rooms/[code]/leave
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
      include: {
        players: { orderBy: { joinedAt: "asc" } },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Remove the player
    await prisma.roomPlayer.deleteMany({
      where: { roomId: room.id, userId: user.id },
    });

    const remaining = room.players.filter((p) => p.userId !== user.id);

    // No one left — delete the room and any game state
    if (remaining.length === 0) {
      await prisma.dotsGame.deleteMany({ where: { roomId: room.id } });
      await prisma.room.delete({ where: { id: room.id } });
      return NextResponse.json({ deleted: true });
    }

    // Host left — promote next player
    if (room.hostId === user.id) {
      const nextHost = remaining[0];
      await prisma.room.update({
        where: { id: room.id },
        data: { hostId: nextHost.userId },
      });
      await prisma.roomPlayer.update({
        where: {
          roomId_userId: { roomId: room.id, userId: nextHost.userId },
        },
        data: { isHost: true },
      });
    }

    // Handle active game
    if (room.status === "playing") {
      // Dots game — adjust turn order
      if (room.gameId === "dots-and-boxes") {
        const game = await prisma.dotsGame.findUnique({
          where: { roomId: room.id },
        });
        if (game) {
          const turnOrder = (game.turnOrder as string[]) ?? [];
          const leftIndex = turnOrder.indexOf(user.id);
          const newOrder = turnOrder.filter((id) => id !== user.id);

          // If only 1 player remains → they win
          if (newOrder.length === 1) {
            await prisma.dotsGame.update({
              where: { roomId: room.id },
              data: {
                turnOrder: newOrder,
                currentTurn: 0,
                winnerId: newOrder[0],
                turnStartedAt: new Date(),
              },
            });
            return NextResponse.json({ left: true, gameEnded: true });
          }

          // Otherwise adjust current turn
          let newCurrentTurn = game.currentTurn;
          if (leftIndex !== -1) {
            if (leftIndex < game.currentTurn) {
              newCurrentTurn = game.currentTurn - 1;
            } else if (leftIndex === game.currentTurn) {
              newCurrentTurn = game.currentTurn % newOrder.length;
            }
          }
          if (newCurrentTurn >= newOrder.length) {
            newCurrentTurn = 0;
          }

          await prisma.dotsGame.update({
            where: { roomId: room.id },
            data: {
              turnOrder: newOrder,
              currentTurn: newCurrentTurn,
              turnStartedAt: new Date(),
            },
          });
        }
      } else {
        // Bingo — award win to remaining player if only 1 left
        if (remaining.length === 1) {
          await prisma.room.update({
            where: { id: room.id },
            data: {
              status: "finished",
              state: {
                winnerId: remaining[0].userId,
                winningLines: [],
                finishedAt: new Date().toISOString(),
                reason: "opponent_left",
              } as object,
            },
          });
        }
      }
    }

    return NextResponse.json({ left: true });
  } catch (e) {
    console.error("POST leave error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}