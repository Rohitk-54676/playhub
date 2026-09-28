"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { ProfilePopover } from "./ProfilePopover";
import type { Friend } from "@/lib/types";

interface Props {
  friends: Friend[];
}

export function FriendList({ friends }: Props) {
  if (friends.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No friends yet. Search for someone by username above.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {friends.map((friend) => {
        const name = friend.display_name ?? friend.username;
        return (
          <div
            key={friend.id}
            className="flex items-center gap-3 rounded-xl border bg-card p-3"
          >
            <ProfilePopover
              userId={friend.id}
              username={friend.username}
              displayName={friend.display_name}
              avatarUrl={friend.avatar_url}
              size="md"
            />

            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${friend.username}`}
                className="block truncate font-medium hover:underline"
              >
                {name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                @{friend.username}
              </p>
            </div>

            <button
              disabled
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
              title="Messaging coming in Module 4"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}