"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UserAvatar } from "./UserAvatar";
import { FriendButton } from "./FriendButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  userId: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

export function ProfilePopover({
  userId,
  username,
  displayName,
  avatarUrl,
  size = "md",
}: Props) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const name = displayName ?? username;

  async function openChat() {
    setOpening(true);
    try {
      const res = await fetch("/api/dm/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: userId }),
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
    <Popover>
      <PopoverTrigger
        render={
          <button className="rounded-full transition-transform hover:scale-105">
            <UserAvatar
              username={username}
              displayName={displayName}
              avatarUrl={avatarUrl}
              size={size}
            />
          </button>
        }
      />

      <PopoverContent align="start" className="w-64 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <UserAvatar
              username={username}
              displayName={displayName}
              avatarUrl={avatarUrl}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${username}`}
                className="block truncate font-semibold hover:underline"
              >
                {name}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                @{username}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <FriendButton targetId={userId} size="sm" />
            <Button
              size="sm"
              variant="outline"
              onClick={openChat}
              disabled={opening}
            >
              {opening ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Link
            href={`/profile/${username}`}
            className="text-center text-xs text-muted-foreground hover:text-foreground"
          >
            View full profile
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}