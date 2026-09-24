import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { id, username, display_name, is_guest } = await req.json();

    if (!id || !username) {
      return NextResponse.json(
        { error: "Missing id or username" },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 }
      );
    }

    const existing = await prisma.profile.findUnique({ where: { id } });
    if (existing) {
      return NextResponse.json(existing);
    }

    const profile = await prisma.profile.create({
      data: {
        id,
        username: cleanUsername,
        displayName: display_name ?? cleanUsername,
        isGuest: is_guest ?? false,
      },
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
    console.error("POST /api/profile/create error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}