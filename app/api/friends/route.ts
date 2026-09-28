import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/friends — list accepted friends
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        addressee: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const friends = friendships.map((f) => {
      const other = f.requesterId === user.id ? f.addressee : f.requester;
      return {
        id: other.id,
        username: other.username,
        display_name: other.displayName,
        avatar_url: other.avatarUrl,
        friendshipId: f.id,
      };
    });

    return NextResponse.json(friends);
  } catch (e) {
    console.error("GET /api/friends error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}