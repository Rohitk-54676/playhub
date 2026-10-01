"use client";

import { Crown } from "lucide-react";
import { UserAvatar } from "@/components/social/UserAvatar";
import type { RoomPlayer } from "@/hooks/useRoom";

interface Props {
  players: RoomPlayer[];
  hostId: string;
  currentUserId?: string;
}

export function PlayerList({ players, hostId, currentUserId }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {players.map((p) => {
        const isHost = p.id === hostId;
        const isMe = p.id === currentUserId;
        const name = p.display_name ?? p.username;

        return (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-xl border bg-card p-3"
          >
            <UserAvatar
              username={p.username}
              displayName={p.display_name}
              avatarUrl={p.avatar_url}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium">{name}</span>
                {isMe && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
                {isHost && (
                  <Crown className="h-3.5 w-3.5 text-yellow-500" />
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                @{p.username}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}