import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/announcements — public list of recent active announcements
export async function GET() {
  try {
    const now = new Date();
    const items = await prisma.announcement.findMany({
      where: {
        active: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(
      items.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        type: a.type,
        created_at: a.createdAt.toISOString(),
      }))
    );
  } catch (e) {
    console.error("GET /api/announcements error:", e);
    return NextResponse.json([]);
  }
}