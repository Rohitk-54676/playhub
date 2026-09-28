import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/conversations/[id] — conversation details + members
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
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        members: {
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
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify user is a member
    const isMember = conversation.members.some((m) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const otherMembers = conversation.members.filter(
      (m) => m.userId !== user.id
    );

    let displayName = conversation.name;
    let displayAvatar: string | null = null;

    if (conversation.type === "direct" && otherMembers[0]) {
      const other = otherMembers[0].user;
      displayName = other.displayName ?? other.username;
      displayAvatar = other.avatarUrl;
    } else if (conversation.type === "group") {
      displayName = conversation.name ?? `Group (${conversation.members.length})`;
    }

    return NextResponse.json({
      id: conversation.id,
      type: conversation.type,
      name: displayName,
      avatar_url: displayAvatar,
      members: conversation.members.map((m) => ({
        id: m.user.id,
        username: m.user.username,
        display_name: m.user.displayName,
        avatar_url: m.user.avatarUrl,
      })),
    });
  } catch (e) {
    console.error("GET /api/conversations/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}