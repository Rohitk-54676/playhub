"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useRoom } from "@/hooks/useRoom";
import { RoomLobby } from "@/components/room/RoomLobby";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function RoomPage({
  params,
}: {
  params: Promise<{ gameId: string; code: string }>;
}) {
  const { gameId, code } = use(params);
  const router = useRouter();
  const { room, loading, error, join, leave, start } = useRoom(code);

  useEffect(() => {
    if (error) {
      toast.error(error);
      router.replace(`/play/${gameId}`);
    }
  }, [error, gameId, router]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">
          {error ?? "Room not found."}
        </p>
        <Button onClick={() => router.push(`/play/${gameId}`)}>
          Back to {gameId}
        </Button>
      </div>
    );
  }

  // Game not started yet — show lobby
  if (room.status === "lobby") {
    return (
      <RoomLobby
        room={room}
        onStart={start}
        onLeave={leave}
        onJoin={join}
      />
    );
  }

  // Game in progress — placeholder for now
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Game in progress</h1>
      <p className="text-muted-foreground">
        Room {room.code} · {room.players.length} players
      </p>
      <p className="text-sm text-muted-foreground">
        Game logic coming in Module 6.
      </p>
      <Button onClick={leave} variant="outline">
        Leave Room
      </Button>
    </div>
  );
}