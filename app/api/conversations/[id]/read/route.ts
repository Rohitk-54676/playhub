import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/conversations/[id]/read — mark conversation as read
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId: id, userId: user.id },
      },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST read error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}