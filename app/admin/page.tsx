"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BarChart3,
  Megaphone,
  Flag,
  Home,
  UserCheck,
  UserPlus,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Analytics {
  totals: {
    registeredUsers: number;
    guests: number;
    newUsersToday: number;
    eventsToday: number;
    totalEvents: number;
  };
  daily: { date: string; total: number; registered: number; guest: number }[];
  eventBreakdown: { type: string; count: number }[];
}

export default function AdminHomePage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const maxDaily = data?.daily
    ? Math.max(...data.daily.map((d) => d.total), 1)
    : 1;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
            Admin
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Analytics and management for PlayHub.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = "/")}
        >
          <Home className="mr-1.5 h-4 w-4" />
          Back to app
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Registered users"
          value={data?.totals.registeredUsers ?? "—"}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Guests"
          value={data?.totals.guests ?? "—"}
        />
        <StatCard
          icon={<UserPlus className="h-5 w-5" />}
          label="New today"
          value={data?.totals.newUsersToday ?? "—"}
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Events today"
          value={data?.totals.eventsToday ?? "—"}
        />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Last 7 days
          </h2>
        </div>
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <div className="flex h-40 items-end gap-2">
            {data?.daily.map((d) => {
              const heightPct = (d.total / maxDaily) * 100;
              return (
                <div
                  key={d.date}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <div className="flex h-32 w-full items-end">
                    <div
                      className="w-full rounded-t bg-accent/70 transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${d.total} events`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(d.date).toLocaleDateString([], {
                      weekday: "short",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event breakdown + Admin links */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Events (7 days)
            </h2>
          </div>
          {data?.eventBreakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No events yet
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {data?.eventBreakdown.slice(0, 8).map((e) => (
                <div
                  key={e.type}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="capitalize text-muted-foreground">
                    {e.type.replace(/_/g, " ")}
                  </span>
                  <span className="font-semibold">{e.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/admin/users"
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-all hover:border-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Manage Users</p>
              <p className="text-xs text-muted-foreground">
                Ban, promote, delete
              </p>
            </div>
          </Link>
          <Link
            href="/admin/announcements"
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-all hover:border-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Announcements</p>
              <p className="text-xs text-muted-foreground">
                Banner messages
              </p>
            </div>
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center gap-3 rounded-2xl border bg-card p-4 transition-all hover:border-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Flag className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Reports</p>
              <p className="text-xs text-muted-foreground">
                Handle user reports
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 text-accent">{icon}</div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}