"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Gamepad2, UserPlus, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatar } from "@/components/social/UserAvatar";
import { useNotifications } from "@/hooks/useNotifications";

interface InviteData {
  roomCode: string;
  gameId: string;
  invitedByName: string;
}

interface Props {
  variant?: "nav" | "desktop";
}

export function NotificationBell({ variant = "nav" }: Props) {
  const { notifications, unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);

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

  const triggerClass =
    variant === "desktop"
      ? "relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      : "relative flex items-center justify-center text-muted-foreground transition-colors";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger className={triggerClass}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
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
            notifications.map((n) => {
              const isInvite = n.type === "room_invite";
              const invite = isInvite
                ? (n as unknown as { data?: InviteData }).data
                : null;
              const linkHref =
                isInvite && invite
                  ? `/play/${invite.gameId}/room/${invite.roomCode}`
                  : null;

              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 border-b p-3 last:border-0 ${
                    !n.read ? "bg-accent/5" : ""
                  }`}
                >
                  {n.actor ? (
                    <UserAvatar
                      username={n.actor.username}
                      displayName={n.actor.display_name}
                      avatarUrl={n.actor.avatar_url}
                      size="sm"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                      {isInvite ? (
                        <Gamepad2 className="h-4 w-4 text-accent" />
                      ) : (
                        <UserPlus className="h-4 w-4 text-accent" />
                      )}
                    </div>
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
                      {isInvite && n.actor && (
                        <>
                          <Link
                            href={`/profile/${n.actor.username}`}
                            className="font-medium hover:underline"
                          >
                            {n.actor.display_name ?? n.actor.username}
                          </Link>{" "}
                          invited you to play Bingo.
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

                    {isInvite && linkHref && (
                      <Link
                        href={linkHref}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                      >
                        <Check className="h-3 w-3" />
                        Join room
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}