import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/users/search?q=rohit
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const users = await prisma.profile.findMany({
      where: {
        username: { contains: q, mode: "insensitive" },
        id: { not: user.id },
      },
      take: 10,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    // Normalize to snake_case for consistency with frontend types
    const normalized = users.map((u) => ({
      id: u.id,
      username: u.username,
      display_name: u.displayName,
      avatar_url: u.avatarUrl,
    }));

    return NextResponse.json(normalized);
  } catch (e) {
    console.error("GET /api/users/search error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}