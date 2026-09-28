import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/friends/pending — incoming friend requests
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: user.id,
        status: "pending",
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
      },
      orderBy: { createdAt: "desc" },
    });

    const normalized = requests.map((r) => ({
      id: r.id,
      requester: {
        id: r.requester.id,
        username: r.requester.username,
        display_name: r.requester.displayName,
        avatar_url: r.requester.avatarUrl,
      },
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(normalized);
  } catch (e) {
    console.error("GET /api/friends/pending error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}