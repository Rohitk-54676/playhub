"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatar } from "@/components/social/UserAvatar";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell() {
  const { notifications, unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);

  // Poll every 20s for new notifications (realtime comes in Module 4)
  useEffect(() => {
    const interval = setInterval(refresh, 20000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && unreadCount > 0) {
      await fetch("/api/notifications", { method: "PATCH" });
      refresh();
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 border-b p-3 last:border-0 ${
                  !n.read ? "bg-accent/5" : ""
                }`}
              >
                {n.actor && (
                  <UserAvatar
                    username={n.actor.username}
                    displayName={n.actor.display_name}
                    avatarUrl={n.actor.avatar_url}
                    size="sm"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {n.type === "friend_request" && n.actor && (
                      <>
                        <Link
                          href={`/profile/${n.actor.username}`}
                          className="font-medium hover:underline"
                        >
                          {n.actor.display_name ?? n.actor.username}
                        </Link>{" "}
                        sent you a friend request.
                      </>
                    )}
                    {n.type === "friend_accepted" && n.actor && (
                      <>
                        <Link
                          href={`/profile/${n.actor.username}`}
                          className="font-medium hover:underline"
                        >
                          {n.actor.display_name ?? n.actor.username}
                        </Link>{" "}
                        accepted your friend request.
                      </>
                    )}
                  </p>
                  {n.type === "friend_request" && (
                    <Link
                      href="/friends"
                      className="mt-1 inline-block text-xs text-accent hover:underline"
                    >
                      View request →
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}