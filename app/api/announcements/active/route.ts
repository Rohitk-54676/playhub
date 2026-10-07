import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/announcements/active — the current active banner (if any)
export async function GET() {
  try {
    const now = new Date();
    const item = await prisma.announcement.findFirst({
      where: {
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!item) return NextResponse.json(null);

    return NextResponse.json({
      id: item.id,
      title: item.title,
      body: item.body,
      type: item.type,
    });
  } catch (e) {
    console.error("GET active announcement error:", e);
    return NextResponse.json(null);
  }
}