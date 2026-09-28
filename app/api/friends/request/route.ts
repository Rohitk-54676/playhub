import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/friends/request  { targetId: "uuid" }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { targetId } = await req.json();

  if (!targetId || targetId === user.id) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  try {
    // Check if blocked either way
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: targetId },
          { blockerId: targetId, blockedId: user.id },
        ],
      },
    });
    if (block) {
      return NextResponse.json({ error: "Cannot send request" }, { status: 403 });
    }

    // Check existing friendship
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: user.id, addresseeId: targetId },
          { requesterId: targetId, addresseeId: user.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "Already friends" }, { status: 409 });
      }
      // If they already sent us a request, auto-accept it
      if (existing.requesterId === targetId) {
        const updated = await prisma.friendship.update({
          where: { id: existing.id },
          data: { status: "accepted" },
        });
        return NextResponse.json(updated);
      }
      // We already sent — pending
      return NextResponse.json(existing);
    }

    const friendship = await prisma.friendship.create({
      data: {
        requesterId: user.id,
        addresseeId: targetId,
        status: "pending",
      },
    });

    // Create notification for the target
    await prisma.notification.create({
      data: {
        userId: targetId,
        actorId: user.id,
        type: "friend_request",
        data: { friendshipId: friendship.id },
      },
    });

    return NextResponse.json(friendship);
  } catch (e) {
    console.error("POST /api/friends/request error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}