import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/profile?id=xxx  OR  /api/profile?username=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const username = searchParams.get("username");

  if (!id && !username) {
    return NextResponse.json(
      { error: "Missing id or username" },
      { status: 400 }
    );
  }

  try {
    const profile = id
      ? await prisma.profile.findUnique({ where: { id } })
      : await prisma.profile.findFirst({
          where: { username: { equals: username!, mode: "insensitive" } },
        });

    if (!profile) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (e) {
    console.error("GET /api/profile error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/profile — update own profile
// PATCH /api/profile — update own profile
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { updates } = body as {
    updates: {
      username?: string;
      display_name?: string;
      avatar_url?: string;
      accent?: string;
    };
  };

  // Build a Prisma-safe payload with camelCase keys
  const data: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    accent?: string;
  } = {};

  if (updates.username !== undefined) {
    const u = updates.username.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) {
      return NextResponse.json(
        { error: "Username: 3–20 chars, letters/numbers/underscore only" },
        { status: 400 }
      );
    }
    const reserved = ["admin", "playhub", "root", "support", "api", "me", "you"];
    if (reserved.includes(u)) {
      return NextResponse.json(
        { error: "Username is reserved" },
        { status: 400 }
      );
    }
    data.username = u;
  }

  if (updates.display_name !== undefined) {
    data.displayName = updates.display_name;
  }

  if (updates.avatar_url !== undefined) {
    data.avatarUrl = updates.avatar_url;
  }

  if (updates.accent !== undefined) {
    data.accent = updates.accent;
  }

  try {
    const profile = await prisma.profile.update({
      where: { id: user.id },
      data,
    });
    return NextResponse.json(profile);
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }
    console.error("PATCH /api/profile error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}