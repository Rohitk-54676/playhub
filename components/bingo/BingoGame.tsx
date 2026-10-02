"use client";

import { useSound } from "@/hooks/useSound";
import { Confetti } from "@/components/shared/Confetti";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Trophy, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BingoCard } from "./BingoCard";
import { TurnIndicator } from "./TurnIndicator";
import { UserAvatar } from "@/components/social/UserAvatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface GameState {
  picks: { number: number; userId: string; at: string }[];
  turnOrder: string[];
  currentTurnIndex: number;
  calledNumbers: number[];
  turnStartedAt: string;
  turnEndsAt: string;
  winnerId: string | null;
  winningLines: number[][];
  phase: "picking" | "marking" | "finished";
}

interface PlayerInfo {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface MyCard {
  numbers: number[];
  marked: number[];
  lines: number;
  bingoLockoutUntil: string | null;
}

interface Props {
  roomId: string;
  roomCode: string;
  currentUserId: string;
  players: PlayerInfo[];
  hostId: string;
}

export function BingoGame({
  roomId,
  roomCode,
  currentUserId,
  players,
  hostId,
}: Props) {
  const router = useRouter();
  const { play } = useSound();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myCard, setMyCard] = useState<MyCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [bingoLoading, setBingoLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastCalledRef = useRef<number>(0);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/bingo`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setGameState(data.gameState);
      setMyCard(data.myCard);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [roomCode]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Poll every 5s while game is live
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase === "finished" || gameState.winnerId) return;

    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [fetchState, gameState]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`bingo:${roomCode.toUpperCase()}`)
      .on("broadcast", { event: "state_update" }, () => {
        fetchState();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [roomCode, fetchState]);

  const broadcastUpdate = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: "broadcast",
        event: "state_update",
        payload: {},
      });
    }
  }, []);

  async function handlePick(cellIndex: number) {
    if (picking || !myCard) return;

    const prevMarked = myCard.marked;
    const prevLines = myCard.lines;
    setMyCard({
      ...myCard,
      marked: [...myCard.marked, cellIndex],
      lines: myCard.lines,
    });
    setPicking(true);

    try {
      const res = await fetch(`/api/rooms/${roomCode}/bingo/pick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cellIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMyCard({ ...myCard, marked: prevMarked, lines: prevLines });
        toast.error(data.error ?? "Failed to pick");
        setPicking(false);
        return;
      }
      play("pick");
      await fetchState();
      await broadcastUpdate();
    } catch {
      setMyCard({ ...myCard, marked: prevMarked, lines: prevLines });
      toast.error("Network error");
    }
    setPicking(false);
  }

  async function handleMark(cellIndex: number) {
    if (!myCard) return;
    const prevMarked = myCard.marked;
    setMyCard({ ...myCard, marked: [...myCard.marked, cellIndex] });
    try {
      await fetch(`/api/rooms/${roomCode}/bingo/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cellIndex }),
      });
      play("mark");
      await fetchState();
    } catch {
      setMyCard({ ...myCard, marked: prevMarked });
    }
  }

  async function handleBingo() {
    setBingoLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/bingo/bingo`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Not a valid bingo");
        await fetchState();
        setBingoLoading(false);
        return;
      }
      play("win");
      toast.success("🎉 BINGO! You win!");
      await fetchState();
      await broadcastUpdate();
    } catch {
      toast.error("Network error");
    }
    setBingoLoading(false);
  }

  async function handleRestart() {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/restart`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to restart");
        return;
      }
      await fetchState();
      await broadcastUpdate();
    } catch {
      toast.error("Network error");
    }
  }

  async function handleLeave() {
    await fetch(`/api/rooms/${roomCode}/leave`, { method: "POST" });
    router.push("/play/bingo");
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!gameState || !myCard) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">Game state unavailable.</p>
        <Button onClick={handleLeave} variant="outline">
          Leave room
        </Button>
      </div>
    );
  }

  const currentPickerId = gameState.turnOrder[gameState.currentTurnIndex];
  const isMyTurn = currentPickerId === currentUserId;
  const currentPlayer = players.find((p) => p.id === currentPickerId);
  const currentPlayerName =
    currentPlayer?.display_name ?? currentPlayer?.username ?? "Someone";

  // Winner screen
  if (gameState.phase === "finished" || gameState.winnerId) {
    const winner = players.find((p) => p.id === gameState.winnerId);
    const winnerName = winner?.display_name ?? winner?.username ?? "Someone";
    const isMeWinner = gameState.winnerId === currentUserId;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-full flex-col items-center justify-center gap-5 text-center"
      >
        <Confetti trigger={true} />
        <div className="text-5xl">🎉</div>
        <div>
          <h1 className="text-2xl font-bold">
            {isMeWinner ? "You won!" : `${winnerName} won!`}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {gameState.winningLines.length} winning lines
          </p>
        </div>

        <div className="w-full max-w-[380px]">
          <BingoCard
            numbers={myCard.numbers}
            marked={myCard.marked}
            clickable={false}
          />
        </div>

        <div className="flex gap-2">
          {currentUserId === hostId && (
            <Button onClick={handleRestart}>Play Again</Button>
          )}
          <Button variant="outline" onClick={handleLeave}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Leave
          </Button>
        </div>
      </motion.div>
    );
  }

  const lockoutActive =
    myCard.bingoLockoutUntil &&
    new Date(myCard.bingoLockoutUntil).getTime() > Date.now();

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
            Room <span className="font-mono font-medium">{roomCode}</span>
          </p>
          <h1 className="text-base font-bold leading-tight">Bingo</h1>
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

      <TurnIndicator
        key={`${currentPickerId}-${gameState.calledNumbers.length}`}
        isYourTurn={isMyTurn}
        currentPlayerName={currentPlayerName}
        phase={gameState.phase}
      />

      <div className="flex shrink-0 items-center gap-2 rounded-lg border bg-card px-2 py-1">
        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Called
        </span>
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {gameState.calledNumbers.length === 0 ? (
            <span className="text-[10px] text-muted-foreground">—</span>
          ) : (
            [...gameState.calledNumbers].reverse().map((n, i) => (
              <span
                key={`${n}-${i}`}
                className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded bg-accent px-1.5 text-[10px] font-bold text-accent-fg"
              >
                {n}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1">
        <p className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
          Your card · {myCard.lines}/5 lines
        </p>
        <BingoCard
          numbers={myCard.numbers}
          marked={myCard.marked}
          clickable={isMyTurn && !picking}
          onMark={isMyTurn ? handlePick : handleMark}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <Button
          onClick={handleBingo}
          disabled={bingoLoading || myCard.lines < 5 || !!lockoutActive}
          size="sm"
          className="w-full"
          variant={myCard.lines >= 5 ? "default" : "outline"}
        >
          {bingoLoading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Trophy className="mr-1.5 h-4 w-4" />
          )}
          {lockoutActive
            ? "Locked out (false BINGO)"
            : myCard.lines >= 5
            ? "BINGO!"
            : `${myCard.lines}/5 lines`}
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-1">
          {players.map((p) => {
            const isCurrentTurn = p.id === currentPickerId;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 ${
                  isCurrentTurn ? "border-accent bg-accent/10" : "bg-card"
                }`}
              >
                <UserAvatar
                  username={p.username}
                  displayName={p.display_name}
                  avatarUrl={p.avatar_url}
                  size="sm"
                />
                <span className="text-[10px] font-medium">
                  {p.display_name ?? p.username}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}