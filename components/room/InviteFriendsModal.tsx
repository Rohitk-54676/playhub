"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/social/UserAvatar";
import { getFriends } from "@/lib/social/friends";
import type { Friend } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomCode: string;
  currentPlayers: string[]; // user IDs already in the room
}

export function InviteFriendsModal({
  open,
  onOpenChange,
  roomCode,
  currentPlayers,
}: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getFriends().then((f) => {
      setFriends(f);
      setLoading(false);
    });
  }, [open]);

  async function handleInvite(friend: Friend) {
    setSending(friend.id);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: friend.id }),
      });
      const data = await res.json();

      if (!res.ok && !data.already) {
        toast.error(data.error ?? "Failed to invite");
        setSending(null);
        return;
      }

      toast.success(
        data.already
          ? `${friend.display_name ?? friend.username} was already invited`
          : `Invited ${friend.display_name ?? friend.username}`
      );
      setSent((prev) => new Set(prev).add(friend.id));
    } catch {
      toast.error("Network error");
    }
    setSending(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite friends</DialogTitle>
          <DialogDescription>
            Send a friend a link to join this room.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : friends.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center">
              <UserPlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No friends yet. Add some from the Friends page.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {friends.map((f) => {
                const inRoom = currentPlayers.includes(f.id);
                const alreadySent = sent.has(f.id);
                const isSending = sending === f.id;

                return (
                  <button
                    key={f.id}
                    onClick={() => handleInvite(f)}
                    disabled={inRoom || alreadySent || isSending}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors",
                      !inRoom &&
                        !alreadySent &&
                        "hover:bg-accent/5 hover:border-accent cursor-pointer",
                      (inRoom || alreadySent) && "opacity-60 cursor-default"
                    )}
                  >
                    <UserAvatar
                      username={f.username}
                      displayName={f.display_name}
                      avatarUrl={f.avatar_url}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {f.display_name ?? f.username}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        @{f.username}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {inRoom ? (
                        <span className="text-xs text-muted-foreground">
                          In room
                        </span>
                      ) : alreadySent ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <span className="text-xs font-medium text-accent">
                          Invite
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}