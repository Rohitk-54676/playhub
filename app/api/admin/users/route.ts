import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/users?q=&page=1&filter=all
export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 25;
  const filter = searchParams.get("filter") ?? "all";

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { username: { contains: q, mode: "insensitive" } },
      { displayName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filter === "registered") where.isGuest = false;
  if (filter === "guests") where.isGuest = true;
  if (filter === "admins") where.isAdmin = true;
  if (filter === "banned") where.isBanned = true;

  try {
    const [total, users] = await Promise.all([
      prisma.profile.count({ where }),
      prisma.profile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isGuest: true,
          isAdmin: true,
          isBanned: true,
          createdAt: true,
          lastSeenAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        display_name: u.displayName,
        avatar_url: u.avatarUrl,
        is_guest: u.isGuest,
        is_admin: u.isAdmin,
        is_banned: u.isBanned,
        created_at: u.createdAt.toISOString(),
        last_seen_at: u.lastSeenAt?.toISOString() ?? null,
      })),
      total,
      page,
      pageCount: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error("GET /api/admin/users error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}