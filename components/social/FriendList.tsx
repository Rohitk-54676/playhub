"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { ProfilePopover } from "./ProfilePopover";
import type { Friend } from "@/lib/types";
import { toast } from "sonner";

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
      {friends.map((friend) => (
        <FriendRow key={friend.id} friend={friend} />
      ))}
    </div>
  );
}

function FriendRow({ friend }: { friend: Friend }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const name = friend.display_name ?? friend.username;

  async function openChat() {
    setOpening(true);
    try {
      const res = await fetch("/api/dm/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: friend.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to open chat");
        setOpening(false);
        return;
      }
      const data = await res.json();
      router.push(`/messages/${data.id}`);
    } catch {
      toast.error("Network error");
      setOpening(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
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
        onClick={openChat}
        disabled={opening}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        title="Message"
      >
        {opening ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}