import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// POST /api/track  { eventType, metadata? }
export async function POST(req: NextRequest) {
  try {
    const { eventType, metadata } = await req.json();

    if (!eventType || typeof eventType !== "string") {
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 });
    }

    // Determine who this is (may be null for guests)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let isGuest = true;
    if (user) {
      const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { isGuest: true },
      });
      isGuest = profile?.isGuest ?? false;

      // Update lastSeenAt (throttled to once per hour per user)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const existing = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { lastSeenAt: true },
      });
      if (!existing?.lastSeenAt || existing.lastSeenAt < oneHourAgo) {
        await prisma.profile.update({
          where: { id: user.id },
          data: { lastSeenAt: new Date() },
        });
      }
    }

    await prisma.analyticsEvent.create({
      data: {
        eventType,
        userId: user?.id ?? null,
        isGuest,
        metadata: metadata ?? undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Never fail — analytics should never break the app
    console.error("POST /api/track error:", e);
    return NextResponse.json({ ok: true });
  }
}