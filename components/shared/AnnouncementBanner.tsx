"use client";

import { useEffect, useState } from "react";
import { Info, AlertTriangle, CheckCircle2, X } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "info" | "warning" | "success";
}

const TYPE_STYLES = {
  info: "border-accent/30 bg-accent/5 text-accent",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-600",
  success: "border-green-500/30 bg-green-500/5 text-green-600",
};

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Restore dismissed IDs from localStorage
    try {
      const stored = localStorage.getItem("playhub_dismissed");
      if (stored) setDismissed(new Set(JSON.parse(stored)));
    } catch {
      // ignore
    }

    fetch("/api/announcements/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAnnouncement(d))
      .catch(() => {});
  }, []);

  function handleDismiss(id: string) {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    try {
      localStorage.setItem("playhub_dismissed", JSON.stringify([...next]));
    } catch {
      // ignore
    }
  }

  if (!announcement) return null;
  if (dismissed.has(announcement.id)) return null;

  const type = announcement.type as keyof typeof TYPE_STYLES;
  const Icon = ICONS[type] ?? Info;
  const styles = TYPE_STYLES[type] ?? TYPE_STYLES.info;

  return (
    <div className={`border-b ${styles}`}>
      <div className="mx-auto flex max-w-5xl items-start gap-3 px-4 py-3 md:px-8">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{announcement.title}</p>
          <p className="mt-0.5 text-xs opacity-90">{announcement.body}</p>
        </div>
        <button
          onClick={() => handleDismiss(announcement.id)}
          className="shrink-0 rounded-md p-1 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}