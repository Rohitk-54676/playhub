import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });
  if (!profile?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalGuests,
      newUsersToday,
      eventsToday,
      totalEvents,
      recentEvents,
    ] = await Promise.all([
      prisma.profile.count({ where: { isGuest: false } }),
      prisma.profile.count({ where: { isGuest: true } }),
      prisma.profile.count({
        where: { isGuest: false, createdAt: { gte: today } },
      }),
      prisma.analyticsEvent.count({ where: { createdAt: { gte: today } } }),
      prisma.analyticsEvent.count(),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { eventType: true, isGuest: true, createdAt: true },
      }),
    ]);

    // Daily counts for the last 7 days
    const dailyBuckets: Record<
      string,
      { date: string; total: number; registered: number; guest: number }
    > = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10);
      dailyBuckets[key] = {
        date: key,
        total: 0,
        registered: 0,
        guest: 0,
      };
    }
    for (const ev of recentEvents) {
      const key = ev.createdAt.toISOString().slice(0, 10);
      if (dailyBuckets[key]) {
        dailyBuckets[key].total += 1;
        if (ev.isGuest) dailyBuckets[key].guest += 1;
        else dailyBuckets[key].registered += 1;
      }
    }

    // Event breakdown
    const eventCounts: Record<string, number> = {};
    for (const ev of recentEvents) {
      eventCounts[ev.eventType] = (eventCounts[ev.eventType] ?? 0) + 1;
    }
    const eventBreakdown = Object.entries(eventCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totals: {
        registeredUsers: totalUsers,
        guests: totalGuests,
        newUsersToday,
        eventsToday,
        totalEvents,
      },
      daily: Object.values(dailyBuckets),
      eventBreakdown,
    });
  } catch (e) {
    console.error("GET /api/admin/analytics error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}