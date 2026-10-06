"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, LogOut, Trophy } from "lucide-react";
import { DotsBoard } from "./DotsBoard";
import { UserAvatar } from "@/components/social/UserAvatar";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/useSound";
import { useDots } from "@/hooks/useDots";
import { boxIndex } from "@/lib/dots/grid";
import { toast } from "sonner";

interface PlayerInfo {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  roomCode: string;
  currentUserId: string;
  players: PlayerInfo[];
  hostId: string;
}

export function DotsGame({
  roomCode,
  currentUserId,
  players,
  hostId,
}: Props) {
  const router = useRouter();
  const { play } = useSound();
  const { state, loading, drawing, drawLine } = useDots(roomCode);
  const prevBoxCount = useRef(0);

  // Play sound when a box is completed
  useEffect(() => {
    if (!state) return;
    const count = Object.keys(state.boxes).length;
    if (count > prevBoxCount.current && prevBoxCount.current > 0) {
      play("mark");
    }
    prevBoxCount.current = count;
  }, [state, play]);

  async function handleDraw(type: "h" | "v", index: number) {
    const { error } = await drawLine(type, index);
    if (error) {
      toast.error(error);
      return;
    }
    play("pick");
  }

  async function handleLeave() {
    await fetch(`/api/rooms/${roomCode}/leave`, { method: "POST" });
    router.push("/play/dots-and-boxes");
  }

  if (loading || !state) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlayerId = state.turnOrder[state.currentTurn];
  const isMyTurn = currentPlayerId === currentUserId;
  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const currentPlayerName =
    currentPlayer?.display_name ?? currentPlayer?.username ?? "Someone";

  // Box counts
  const boxCounts: Record<string, number> = {};
  for (const id of state.turnOrder) boxCounts[id] = 0;
  for (const b of Object.values(state.boxes)) {
    boxCounts[b.playerId] = (boxCounts[b.playerId] ?? 0) + 1;
  }

  const totalBoxes = (state.size - 1) * (state.size - 1);
  const totalClaimed = Object.keys(state.boxes).length;
  const boardFull = totalClaimed === totalBoxes;

  // Winner screen
  if (state.finished || boardFull) {
    let winnerId = state.winnerId;
    if (!winnerId) {
      // Compute by count
      let max = -1;
      for (const [pid, count] of Object.entries(boxCounts)) {
        if (count > max) {
          max = count;
          winnerId = pid;
        }
      }
    }
    const winner = players.find((p) => p.id === winnerId);
    const winnerName = winner?.display_name ?? winner?.username ?? "Nobody";
    const isMeWinner = winnerId === currentUserId;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-full flex-col items-center justify-center gap-5 text-center"
      >
        <div className="text-5xl">🎉</div>
        <div>
          <h1 className="text-2xl font-bold">
            {isMeWinner ? "You won!" : `${winnerName} won!`}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {boxCounts[winnerId ?? ""] ?? 0} boxes
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLeave}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Leave
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
            Room <span className="font-mono font-medium">{roomCode}</span>
          </p>
          <h1 className="text-base font-bold leading-tight">Dots & Boxes</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLeave}
          className="h-7 px-2 text-xs"
        >
          <LogOut className="mr-1 h-3.5 w-3.5" />
          Leave
        </Button>
      </div>

      {/* Turn indicator */}
      <div
        className={`shrink-0 rounded-lg border px-3 py-1.5 text-center ${
          isMyTurn ? "border-accent bg-accent/10" : "bg-card"
        }`}
      >
        <p className={`text-xs font-medium ${isMyTurn ? "text-accent" : ""}`}>
          {isMyTurn ? "🎯 Your turn — draw a line" : `${currentPlayerName}'s turn`}
        </p>
      </div>

      {/* Board */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <DotsBoard
          state={state}
          currentUserId={currentUserId}
          canDraw={isMyTurn && !drawing}
          onDraw={handleDraw}
        />
      </div>

      {/* Players */}
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
        {players.map((p) => {
          const isCurrentTurn = p.id === currentPlayerId;
          const color = state.playerColors[p.id] ?? "#888";
          const letter = state.playerLetters[p.id] ?? "?";
          const count = boxCounts[p.id] ?? 0;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${
                isCurrentTurn ? "border-accent bg-accent/10" : "bg-card"
              }`}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {letter}
              </span>
              <span className="text-[10px] font-medium">
                {p.display_name ?? p.username}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({count})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}