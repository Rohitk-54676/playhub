import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/conversations — list all conversations I'm part of
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
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
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Build thread summary
    const threads = await Promise.all(
      memberships.map(async (m) => {
        const conv = m.conversation;
        const otherMembers = conv.members.filter((cm) => cm.userId !== user.id);

        // For direct chats, "name" is the other person
        let displayName = conv.name;
        let displayAvatar: string | null = null;
        let otherUserId: string | null = null;

        if (conv.type === "direct" && otherMembers[0]) {
          const other = otherMembers[0].user;
          displayName = other.displayName ?? other.username;
          displayAvatar = other.avatarUrl;
          otherUserId = other.id;
        } else if (conv.type === "group") {
          displayName = conv.name ?? `Group (${conv.members.length})`;
        }

        const lastMsg = conv.messages[0];

        // Count unread
        const unread = await prisma.message.count({
          where: {
            conversationId: conv.id,
            createdAt: { gt: m.lastReadAt },
            senderId: { not: user.id },
          },
        });

        return {
          id: conv.id,
          type: conv.type,
          name: displayName,
          avatar_url: displayAvatar,
          other_user_id: otherUserId,
          member_count: conv.members.length,
          last_message: lastMsg
            ? {
                body: lastMsg.body,
                sender_name:
                  lastMsg.sender.displayName ?? lastMsg.sender.username,
                created_at: lastMsg.createdAt.toISOString(),
              }
            : null,
          unread_count: unread,
          updated_at: conv.updatedAt.toISOString(),
        };
      })
    );

    threads.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return NextResponse.json(threads);
  } catch (e) {
    console.error("GET /api/conversations error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}