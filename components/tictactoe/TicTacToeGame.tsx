"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, LogOut, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TicTacToeBoard } from "./TicTacToeBoard";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/useSound";
import type { Board, Player } from "@/lib/tictactoe/logic";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

const X_COLOR = "#a855f7";
const O_COLOR = "#3b82f6";

interface GameState {
  board: Board;
  currentPlayer: Player;
  xUserId: string;
  oUserId: string;
  winner: Player | null;
  winningLine: number[] | null;
  draw: boolean;
  finished: boolean;
}

interface Props {
  roomCode: string;
  currentUserId: string;
  hostId: string;
}

export function TicTacToeGame({
  roomCode,
  currentUserId,
  hostId,
}: Props) {
  const router = useRouter();
  const { play } = useSound();
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/tictactoe`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setState(data.gameState);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [roomCode]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tictactoe:${roomCode.toUpperCase()}`)
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

  async function handlePlay(index: number) {
    if (sending || !state || state.finished) return;
    setSending(true);
    try {
      const res = await fetch(`/api/rooms/${roomCode}/tictactoe/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to move");
        setSending(false);
        return;
      }
      setState(data.state);
      if (data.state.winner) play("win");
      else if (data.state.draw) play("mark");
      else play("pick");
      await broadcastUpdate();
    } catch {
      toast.error("Network error");
    }
    setSending(false);
  }

  async function handleRestart() {
    try {
      const res = await fetch(`/api/rooms/${roomCode}/tictactoe`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to restart");
        return;
      }
      const data = await res.json();
      setState(data.state);
      await broadcastUpdate();
    } catch {
      toast.error("Network error");
    }
  }

  async function handleLeave() {
    await fetch(`/api/rooms/${roomCode}/leave`, { method: "POST" });
    router.push("/play/tic-tac-toe");
  }

  if (loading || !state) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const mySymbol: Player | null =
    state.xUserId === currentUserId
      ? "X"
      : state.oUserId === currentUserId
      ? "O"
      : null;

  const currentUserIdThisTurn =
    state.currentPlayer === "X" ? state.xUserId : state.oUserId;
  const isMyTurn = currentUserIdThisTurn === currentUserId && !state.finished;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="h-7 w-7 p-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Room {roomCode}
            </p>
            <h1 className="text-base font-bold leading-tight">Tic Tac Toe</h1>
          </div>
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

      <div
        className="shrink-0 rounded-lg border px-3 py-1.5 text-center"
        style={{
          borderColor: state.finished
            ? undefined
            : state.currentPlayer === "X"
            ? `${X_COLOR}50`
            : `${O_COLOR}50`,
          backgroundColor: state.finished
            ? undefined
            : state.currentPlayer === "X"
            ? `${X_COLOR}15`
            : `${O_COLOR}15`,
        }}
      >
        <p
          className="text-xs font-medium"
          style={{
            color: state.finished
              ? undefined
              : state.currentPlayer === "X"
              ? X_COLOR
              : O_COLOR,
          }}
        >
          {state.finished ? (
            state.winner ? (
              state.winner === mySymbol ? (
                <>🏆 You won!</>
              ) : (
                <>You lost — {state.winner} won</>
              )
            ) : (
              <>It's a draw!</>
            )
          ) : isMyTurn ? (
            <>🎯 Your turn — you're {mySymbol}</>
          ) : (
            <>Waiting for opponent…</>
          )}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <TicTacToeBoard
          board={state.board}
          currentPlayer={state.currentPlayer}
          canPlay={isMyTurn && !sending}
          xColor={X_COLOR}
          oColor={O_COLOR}
          winLine={state.winningLine}
          onPlay={handlePlay}
        />
      </div>

      {state.finished && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex shrink-0 justify-center gap-2"
        >
          {currentUserId === hostId && (
            <Button onClick={handleRestart}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Play Again
            </Button>
          )}
          <Button variant="outline" onClick={handleLeave}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Leave
          </Button>
        </motion.div>
      )}
    </div>
  );
}