import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/friends/status?userId=uuid
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get("userId");

  if (!targetId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    // Check blocks
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: targetId },
          { blockerId: targetId, blockedId: user.id },
        ],
      },
    });
    if (block) {
      return NextResponse.json({
        status: block.blockerId === user.id ? "blocked" : "blocked_by_them",
      });
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: user.id, addresseeId: targetId },
          { requesterId: targetId, addresseeId: user.id },
        ],
      },
    });

    if (!friendship) return NextResponse.json({ status: "none" });
    if (friendship.status === "accepted")
      return NextResponse.json({ status: "friends" });
    if (friendship.requesterId === user.id)
      return NextResponse.json({ status: "pending_sent" });
    return NextResponse.json({ status: "pending_received" });
  } catch (e) {
    console.error("GET /api/friends/status error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}