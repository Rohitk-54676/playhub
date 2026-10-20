"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UnoTable } from "./UnoTable";
import { UnoHand } from "./UnoHand";
import { ActionLog, type LogEntry } from "./ActionLog";
import { Button } from "@/components/ui/button";
import { useUnoRealtime } from "@/hooks/useUnoRealtime";
import { useSound } from "@/hooks/useSound";
import type { UnoColor } from "@/lib/uno/types";
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
  hostId: string;
  players: PlayerInfo[];
}

export function UnoGame({
  roomCode,
  currentUserId,
  hostId,
  players,
}: Props) {
  const router = useRouter();
  const { play: playSound } = useSound();
  const [log, setLog] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const [drewPlayable, setDrewPlayable] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);

  const playerIds = players.map((p) => p.id);
  const playerInfo = players.reduce(
    (acc, p) => ({
      ...acc,
      [p.id]: {
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
      },
    }),
    {} as Record<
      string,
      {
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      }
    >
  );

  function addLog(text: string) {
    logIdRef.current += 1;
    const id = `log-${logIdRef.current}-${Date.now()}`;
    setLog((prev) => [
      { id, text, at: new Date().toISOString() },
      ...prev.slice(0, 19),
    ]);
  }

  const {
    state,
    connected,
    play,
    draw,
    passTurn,
    uno,
    catchPlayer,
    acceptDraw,
    challenge,
  } = useUnoRealtime({
    roomCode,
    playerId: currentUserId,
    playerIds,
    isHost: currentUserId === hostId,
    onLog: (text) => addLog(text),
  });

  // Reset "drew playable" flag when turn changes
  useEffect(() => {
    setDrewPlayable(false);
  }, [state?.currentPlayerIndex, state?.turnStartedAt]);

  // Turn countdown timer
  useEffect(() => {
    if (!state || state.phase !== "playing") return;
    const turnStart = state.turnStartedAt
      ? new Date(state.turnStartedAt).getTime()
      : Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - turnStart;
      setSecondsLeft(Math.max(0, Math.ceil((15000 - elapsed) / 1000)));
    }, 250);
    return () => clearInterval(interval);
  }, [state?.turnStartedAt, state?.phase, state]);

  // Play win sound when game ends
  useEffect(() => {
    if (state?.phase === "finished") {
      playSound("win");
    }
  }, [state?.phase, playSound]);

  async function handlePlayCard(cardId: string, chosenColor?: UnoColor) {
    setDrewPlayable(false);
    playSound("pick");
    const { error } = await play(cardId, chosenColor);
    if (error) {
      toast.error(error);
      addLog(`❌ ${error}`);
    }
  }

  async function handleDraw() {
    playSound("mark");
    const { error, drawnCardPlayable } = await draw();
    if (error) {
      toast.error(error);
      return;
    }
    if (drawnCardPlayable) {
      setDrewPlayable(true);
      toast.info("Playable! Play it or click Pass");
    } else {
      toast.info("Drew a card — turn passed");
    }
  }

  async function handlePassTurn() {
    setDrewPlayable(false);
    const { error } = await passTurn();
    if (error) {
      toast.error(error);
    }
  }

  async function handleAcceptDraw() {
    await acceptDraw();
  }

  async function handleChallenge() {
    const { result, error } = await challenge();
    if (error) {
      toast.error(error);
      return;
    }
    if (result === "guilty") {
      toast.success("They were bluffing! They drew 4.");
    } else if (result === "innocent") {
      toast.error("They weren't bluffing. You drew 6.");
    }
  }

  async function handleCallUno() {
    playSound("join");
    await uno();
    toast.success("You called UNO!");
  }

  async function handleCatchUno(targetId: string) {
    playSound("win");
    const { error } = await catchPlayer(targetId);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Caught them!");
    }
  }

  async function handleLeave() {
    await fetch(`/api/rooms/${roomCode}/leave`, { method: "POST" });
    router.push("/play/uno");
  }

  async function handlePlayAgain() {
    try {
      await fetch(`/api/rooms/${roomCode}/restart`, { method: "POST" });
      window.location.reload();
    } catch {
      toast.error("Failed to restart");
    }
  }

  // ---- LOADING ----
  if (!state) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-green-900 to-emerald-950">
        <div className="flex flex-col items-center gap-3 text-white/70">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <p className="text-sm">
            {connected ? "Starting game…" : "Connecting…"}
          </p>
        </div>
      </div>
    );
  }

  // ---- WINNER SCREEN ----
  if (state.phase === "finished") {
    const sorted = [...state.players].sort(
      (a, b) => (a.placement ?? 99) - (b.placement ?? 99)
    );
    const winner = state.players.find((p) => p.id === state.winner);
    const winnerName = winner
      ? playerInfo[winner.id]?.display_name ?? playerInfo[winner.id]?.username
      : "Nobody";
    const iWon = state.winner === currentUserId;

    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-900 via-emerald-900 to-green-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.3),_transparent_70%)]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 flex flex-col items-center gap-6 px-4 text-center"
        >
          <div className="text-6xl">{iWon ? "🏆" : "🎉"}</div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {iWon ? "You won!" : `${winnerName} won!`}
            </h1>
          </div>

          <div className="flex min-w-[280px] flex-col gap-2 rounded-2xl border border-white/20 bg-black/40 p-4 backdrop-blur">
            {sorted.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 text-sm text-white"
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">
                    {p.placement}
                  </span>
                  {playerInfo[p.id]?.display_name ?? playerInfo[p.id]?.username}
                </span>
                <span className="text-white/60">{p.hand.length} cards</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {currentUserId === hostId && (
              <Button onClick={handlePlayAgain}>Play Again</Button>
            )}
            <Button variant="outline" onClick={handleLeave}>
              Leave
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- NORMAL GAME ----
  const isMyTurn =
    state.players[state.currentPlayerIndex].id === currentUserId &&
    state.phase === "playing";

  const iHavePendingDraw =
    state.pendingType !== null && state.pendingPlayerId === currentUserId;

  const me = state.players.find((p) => p.id === currentUserId);
  const iCanCallUno =
    me !== undefined && me.hand.length === 1 && !me.calledUno && !me.finished;

  return (
    <div className="fixed inset-0 flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-green-900 via-emerald-900 to-green-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.25),_transparent_70%)]" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-3 py-2">
          <div className="rounded-lg bg-black/30 px-3 py-1 backdrop-blur">
            <p className="text-[10px] uppercase tracking-wide text-white/60">
              Room
            </p>
            <p className="font-mono text-sm font-bold text-white">{roomCode}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleLeave}
            className="bg-black/30 text-white hover:bg-black/50"
          >
            Leave
          </Button>
        </div>

        {/* Turn countdown */}
        {isMyTurn && !iHavePendingDraw && state.phase === "playing" && (
          <div className="mx-auto mb-1 flex max-w-xs items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 backdrop-blur">
            <span className="text-[11px] font-medium text-white">
              {secondsLeft}s
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-accent transition-all duration-200"
                style={{ width: `${(secondsLeft / 15) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Table Area */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          <UnoTable
            state={state}
            myPlayerId={currentUserId}
            playerInfo={playerInfo}
            hostId={hostId}
            onDrawPileClick={
              isMyTurn && !iHavePendingDraw && !drewPlayable
                ? handleDraw
                : undefined
            }
            onCatchUno={handleCatchUno}
          />
        </div>

        {/* UNO button — bottom-right above hand */}
        {iCanCallUno && (
          <motion.button
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCallUno}
            className="fixed bottom-32 right-4 z-[100] flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-base font-black text-white shadow-2xl ring-4 ring-red-400/50"
          >
            UNO!
          </motion.button>
        )}

        {/* Pending +4 challenge banner */}
        {iHavePendingDraw && state.pendingType === "wild_draw_four" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="z-40 shrink-0 px-3 pb-2"
          >
            <div className="mx-auto flex max-w-md flex-col items-center gap-2 rounded-2xl border-2 border-red-500/50 bg-red-500/10 p-3 backdrop-blur">
              <p className="text-xs font-medium text-white">
                ⚠️ You were hit with a Wild Draw Four
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptDraw}
                  variant="default"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  Draw 4
                </Button>
                <Button
                  onClick={handleChallenge}
                  variant="outline"
                  size="sm"
                  className="bg-black/40 text-white hover:bg-black/60"
                >
                  Challenge
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Drew playable — Play or Pass */}
        {drewPlayable && isMyTurn && !iHavePendingDraw && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="z-40 shrink-0 px-3 pb-2"
          >
            <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-accent/50 bg-accent/10 p-3 backdrop-blur">
              <p className="text-xs font-medium text-white">
                Drew a playable card
              </p>
              <Button
                onClick={handlePassTurn}
                variant="outline"
                size="sm"
                className="bg-black/40 text-white hover:bg-black/60"
              >
                Pass
              </Button>
            </div>
          </motion.div>
        )}

        {/* Hand Area - Fixed at bottom, only horizontal scroll */}
        <div className="z-40 shrink-0 overflow-hidden bg-gradient-to-t from-black/60 to-transparent pb-safe pt-2">
          <UnoHand
            state={state}
            myPlayerId={currentUserId}
            canPlay={isMyTurn && !iHavePendingDraw}
            onPlayCard={handlePlayCard}
          />
        </div>
      </div>

      {/* Action log — hidden on mobile via ActionLog component */}
      <div className="absolute right-3 top-16 z-20">
        <ActionLog entries={log} />
      </div>
    </div>
  );
}