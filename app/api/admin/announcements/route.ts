import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", status: 401, user: null };
  const me = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });
  if (!me?.isAdmin) return { error: "Forbidden", status: 403, user: null };
  return { error: null, status: 200, user };
}

// GET — list all announcements
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const items = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(
      items.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        type: a.type,
        active: a.active,
        starts_at: a.startsAt.toISOString(),
        ends_at: a.endsAt?.toISOString() ?? null,
        created_at: a.createdAt.toISOString(),
      }))
    );
  } catch (e) {
    console.error("GET announcements error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — create a new announcement
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { title, body, type, active } = await req.json();

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json(
      { error: "Title and body required" },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.announcement.create({
      data: {
        title: title.trim(),
        body: body.trim(),
        type: type ?? "info",
        active: active ?? true,
        createdBy: auth.user.id,
      },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    console.error("POST announcement error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}