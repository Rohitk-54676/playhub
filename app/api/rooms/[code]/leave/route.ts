import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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

    await prisma.roomPlayer.deleteMany({
      where: { roomId: room.id, userId: user.id },
    });

    const remaining = room.players.filter((p) => p.userId !== user.id);

    // No one left — delete
    if (remaining.length === 0) {
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

    // Game in progress + only 1 left → game over
    if (room.status === "playing" && remaining.length === 1) {
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

    return NextResponse.json({ left: true });
  } catch (e) {
    console.error("POST leave error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}