import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/conversations/[id]/messages?limit=50&before=timestamp
export async function GET(
  req: NextRequest,
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
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const before = searchParams.get("before");

  try {
    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId: id, userId: user.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: id,
        ...(before && { createdAt: { lt: new Date(before) } }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const normalized = messages.reverse().map((m) => ({
      id: m.id,
      body: m.body,
      created_at: m.createdAt.toISOString(),
      sender: {
        id: m.sender.id,
        username: m.sender.username,
        display_name: m.sender.displayName,
        avatar_url: m.sender.avatarUrl,
      },
    }));

    return NextResponse.json(normalized);
  } catch (e) {
    console.error("GET messages error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/conversations/[id]/messages  { body: "text" }
export async function POST(
  req: NextRequest,
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
  const { body } = await req.json();

  if (!body || typeof body !== "string" || body.trim().length === 0) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  if (body.length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  try {
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId: id, userId: user.id },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.id,
        body: body.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Bump conversation updatedAt
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Mark sender as read
    await prisma.conversationMember.update({
      where: {
        conversationId_userId: { conversationId: id, userId: user.id },
      },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({
      id: message.id,
      body: message.body,
      created_at: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        display_name: message.sender.displayName,
        avatar_url: message.sender.avatarUrl,
      },
    });
  } catch (e) {
    console.error("POST message error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}