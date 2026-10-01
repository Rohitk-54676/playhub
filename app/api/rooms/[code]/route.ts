import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/rooms/[code] — room details + players
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
      include: {
        host: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
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
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: room.id,
      code: room.code,
      gameId: room.gameId,
      hostId: room.hostId,
      status: room.status,
      state: room.state,
      host: {
        id: room.host.id,
        username: room.host.username,
        display_name: room.host.displayName,
        avatar_url: room.host.avatarUrl,
      },
      players: room.players.map((p) => ({
        id: p.user.id,
        username: p.user.username,
        display_name: p.user.displayName,
        avatar_url: p.user.avatarUrl,
        is_host: p.isHost,
        joined_at: p.joinedAt.toISOString(),
      })),
      am_i_host: room.hostId === user.id,
      am_i_member: room.players.some((p) => p.userId === user.id),
    });
  } catch (e) {
    console.error("GET /api/rooms/[code] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}