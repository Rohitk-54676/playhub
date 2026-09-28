import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/dm/open  { targetId: "uuid" }
// Returns existing DM conversation or creates a new one
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
    const existing = await prisma.conversation.findFirst({
      where: {
        type: "direct",
        AND: [
          { members: { some: { userId: user.id } } },
          { members: { some: { userId: targetId } } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json({ id: existing.id, existing: true });
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: "direct",
        createdBy: user.id,
        members: {
          create: [{ userId: user.id }, { userId: targetId }],
        },
      },
    });

    return NextResponse.json({ id: conversation.id, existing: false });
  } catch (e) {
    console.error("POST /api/dm/open error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}