"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useRoom } from "@/hooks/useRoom";
import { RoomLobby } from "@/components/room/RoomLobby";
import { BingoGame } from "@/components/bingo/BingoGame";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

export default function RoomPage({
  params,
}: {
  params: Promise<{ gameId: string; code: string }>;
}) {
  const { gameId, code } = use(params);
  const router = useRouter();
  const { user } = useUser();
  const { room, loading, error, join, leave, start } = useRoom(code);

  useEffect(() => {
    if (error) {
      toast.error(error);
      router.replace(`/play/${gameId}`);
    }
  }, [error, gameId, router]);

  if (loading || !user) {
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

  // Lobby state
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

  // Playing / finished state — show game
  return (
    <BingoGame
      roomId={room.id}
      roomCode={room.code}
      currentUserId={user.id}
      players={room.players.map((p) => ({
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      }))}
      hostId={room.hostId}
    />
  );
}