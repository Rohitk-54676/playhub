import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/conversations/[id]/reads — who has read up to when
export async function GET(
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
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId: id, userId: user.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const reads = await prisma.conversationMember.findMany({
      where: { conversationId: id },
      select: { userId: true, lastReadAt: true },
    });

    return NextResponse.json(
      reads.map((r) => ({
        userId: r.userId,
        lastReadAt: r.lastReadAt.toISOString(),
      }))
    );
  } catch (e) {
    console.error("GET reads error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}