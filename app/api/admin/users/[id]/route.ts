import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

type Action = "ban" | "unban" | "promote" | "demote" | "delete";

// POST /api/admin/users/[id]  { action, reason? }
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
  const me = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });
  if (!me?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action, reason } = (await req.json()) as {
    action: Action;
    reason?: string;
  };

  if (!["ban", "unban", "promote", "demote", "delete"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (id === user.id && (action === "ban" || action === "delete" || action === "demote")) {
    return NextResponse.json(
      { error: "Can't do that to yourself" },
      { status: 400 }
    );
  }

  try {
    if (action === "ban") {
      await prisma.profile.update({
        where: { id },
        data: {
          isBanned: true,
          bannedAt: new Date(),
          bannedReason: reason ?? null,
        },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "unban") {
      await prisma.profile.update({
        where: { id },
        data: { isBanned: false, bannedAt: null, bannedReason: null },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "promote") {
      await prisma.profile.update({
        where: { id },
        data: { isAdmin: true },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "demote") {
      await prisma.profile.update({
        where: { id },
        data: { isAdmin: false },
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "delete") {
      // Cascade deletes handle messages, friends, rooms, etc.
      await prisma.profile.delete({ where: { id } });
      return NextResponse.json({ ok: true, deleted: true });
    }
    return NextResponse.json({ error: "Unknown" }, { status: 400 });
  } catch (e) {
    console.error("POST /api/admin/users/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}