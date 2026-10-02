"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "./useUser";

export function useUnreadMessages() {
  const { user } = useUser();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnread(0);
      return;
    }
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const threads = await res.json();
      const total = threads.reduce(
        (sum: number, t: { unread_count: number }) => sum + t.unread_count,
        0
      );
      setUnread(total);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    refresh();
    // Poll every 15s as a fallback
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { unread, refresh };
}