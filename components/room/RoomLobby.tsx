"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Play, LogOut, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvitePanel } from "./InvitePanel";
import { PlayerList } from "./PlayerList";
import { InviteFriendsModal } from "./InviteFriendsModal";
import { UserAvatar } from "@/components/social/UserAvatar";
import { useUser } from "@/hooks/useUser";
import { useSound } from "@/hooks/useSound";
import type { RoomData } from "@/hooks/useRoom";
import { toast } from "sonner";

interface Props {
  room: RoomData;
  onStart: () => Promise<{ error: string | null }>;
  onLeave: () => void;
  onJoin: () => Promise<{ error: string | null }>;
}

export function RoomLobby({ room, onStart, onLeave, onJoin }: Props) {
  const { user } = useUser();
  const { play } = useSound();
  const prevPlayerCount = useRef<number>(room.players.length);
  const joinAttempted = useRef(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Auto-join if not a member
  useEffect(() => {
    if (joinAttempted.current) return;
    if (!room.am_i_member && user) {
      joinAttempted.current = true;
      onJoin().then((r) => {
        if (r.error) toast.error(r.error);
      });
    }
  }, [room.am_i_member, user, onJoin]);

  // Play sound when new player joins
  useEffect(() => {
    if (room.players.length > prevPlayerCount.current) {
      play("join");
    }
    prevPlayerCount.current = room.players.length;
  }, [room.players.length, play]);

  async function handleStart() {
    const { error } = await onStart();
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Game starting!");
  }

  const canStart =
    room.am_i_host && room.players.length >= 2 && room.status === "lobby";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Waiting room</h1>
          <p className="text-sm text-muted-foreground">
            {room.players.length}/10 players
          </p>
        </div>
        <Button variant="ghost" onClick={onLeave}>
          <LogOut className="mr-1.5 h-4 w-4" />
          Leave
        </Button>
      </div>

      <InvitePanel code={room.code} gameId={room.gameId} />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Players
            </h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="mr-1.5 h-4 w-4" />
            Invite Friends
          </Button>
        </div>

        {room.players.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed bg-card/50">
            <p className="text-sm text-muted-foreground">
              Waiting for players to join…
            </p>
          </div>
        ) : (
          <PlayerList
            players={room.players}
            hostId={room.hostId}
            currentUserId={user?.id}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
        {room.am_i_host ? (
          <>
            <Button
              onClick={handleStart}
              disabled={!canStart}
              size="lg"
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Game
            </Button>
            {!canStart && (
              <p className="text-center text-xs text-muted-foreground">
                {room.players.length < 2
                  ? "Need at least 2 players to start"
                  : "Waiting…"}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <UserAvatar
              username={room.host.username}
              displayName={room.host.display_name}
              avatarUrl={room.host.avatar_url}
              size="md"
            />
            <p className="text-sm text-muted-foreground">
              Waiting for{" "}
              <span className="font-medium text-foreground">
                {room.host.display_name ?? room.host.username}
              </span>{" "}
              to start the game…
            </p>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <InviteFriendsModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roomCode={room.code}
        currentPlayers={room.players.map((p) => p.id)}
      />
    </div>
  );
}