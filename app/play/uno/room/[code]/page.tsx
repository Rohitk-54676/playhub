"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useRoom } from "@/hooks/useRoom";
import { RoomLobby } from "@/components/room/RoomLobby";
import { UnoGame } from "@/components/uno/UnoGame";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

export default function UnoRoomPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = params.code;

  const { user } = useUser();
  const { room, loading, error, join, leave, start } = useRoom(code);

  useEffect(() => {
    if (error) {
      toast.error(error);
      router.replace("/play/uno");
    }
  }, [error, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-green-900 to-emerald-950">
        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-green-900 to-emerald-950 text-white">
        <p className="text-sm text-white/70">{error ?? "Room not found."}</p>
        <Button variant="outline" onClick={() => router.push("/play/uno")}>
          Back to Uno
        </Button>
      </div>
    );
  }

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

  return (
    <UnoGame
      roomCode={room.code}
      currentUserId={user.id}
      hostId={room.hostId}
      players={room.players.map((p) => ({
        id: p.id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      }))}
    />
  );
}