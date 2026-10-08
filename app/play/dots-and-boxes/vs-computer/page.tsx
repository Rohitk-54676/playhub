"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Bot, Loader2, LogOut, RotateCcw } from "lucide-react";
import { DotsBoard } from "@/components/dots/DotsBoard";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/useSound";
import {
  applyOfflineDraw,
  createOfflineGame,
  playerBoxCounts,
  type OfflineDotsState,
} from "@/lib/dots/offline";
import { chooseBotMove } from "@/lib/dots/ai";
import { cn } from "@/lib/utils";

const SIZE_OPTIONS = [5, 6, 7, 8];

export default function VsComputerPage() {
  const router = useRouter();
  const { play } = useSound();
  const [state, setState] = useState<OfflineDotsState | null>(null);
  const [size, setSize] = useState(5);
  const [started, setStarted] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const prevBoxCount = useRef(0);

  // Sound on box completion
  useEffect(() => {
    if (!state) return;
    const count = Object.keys(state.boxes).length;
    if (count > prevBoxCount.current && prevBoxCount.current > 0) {
      play("mark");
    }
    prevBoxCount.current = count;
  }, [state, play]);

  useEffect(() => {
    if (state?.finished) play("win");
  }, [state?.finished, play]);

  // Bot auto-turn
  useEffect(() => {
    if (!state || state.finished) return;
    const current = state.players[state.currentTurn];
    if (current.id !== "p2") return;

    setBotThinking(true);
    const delay = 700 + Math.random() * 500; // 700-1200ms
    const t = setTimeout(() => {
      const move = chooseBotMove(
        state.size,
        state.horizontal,
        state.vertical
      );
      if (move) {
        setState((prev) =>
          prev ? applyOfflineDraw(prev, move.type, move.index) : prev
        );
        play("pick");
      }
      setBotThinking(false);
    }, delay);
    return () => clearTimeout(t);
  }, [state, play]);

  function startGame() {
    const fresh = createOfflineGame(2, size);
    // Rename player 2 to "Computer"
    fresh.players[1] = {
      id: "p2",
      label: "B",
      color: "#3b82f6",
      name: "Computer",
    };
    setState(fresh);
    setStarted(true);
  }

  function handleDraw(type: "h" | "v", index: number) {
    if (!state || state.finished) return;
    const current = state.players[state.currentTurn];
    if (current.id !== "p1") return; // only human can draw
    setState(applyOfflineDraw(state, type, index));
    play("pick");
  }

  function restart() {
    setState(null);
    setStarted(false);
    setBotThinking(false);
  }

  function leave() {
    router.push("/play/dots-and-boxes");
  }

  // Setup screen
  if (!started || !state) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-3"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={leave}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Play vs Computer
            </h1>
            <p className="text-xs text-muted-foreground">
              You are Player A · Computer is B
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
        >
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            <p className="font-semibold">Choose board size</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                  size === s
                    ? "border-accent bg-accent/10 text-accent"
                    : "hover:border-accent/50"
                )}
              >
                <span className="text-sm font-bold">
                  {s}×{s}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {(s - 1) * (s - 1)} boxes
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        <Button onClick={startGame} size="lg" className="w-full">
          Start Game
        </Button>
      </div>
    );
  }

  const currentPlayer = state.players[state.currentTurn];
  const isMyTurn = currentPlayer.id === "p1";
  const boxCounts = playerBoxCounts(state);

  // Winner screen
  if (state.finished) {
    let winnerId = state.winnerId;
    if (!winnerId) {
      let max = -1;
      for (const [, count] of Object.entries(boxCounts)) {
        if (count > max) max = count;
      }
      const entry = Object.entries(boxCounts).find(([, c]) => c === max);
      winnerId = entry?.[0] ?? null;
    }
    const winner = state.players.find((p) => p.id === winnerId);
    const isWinner = winnerId === "p1";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-full flex-col items-center justify-center gap-5 text-center"
      >
        <div className="text-5xl">{isWinner ? "🏆" : "🤖"}</div>
        <div>
          <h1 className="text-2xl font-bold">
            {isWinner ? "You won!" : "Computer won!"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            You {boxCounts.p1 ?? 0} · Computer {boxCounts.p2 ?? 0}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={restart}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Play Again
          </Button>
          <Button variant="outline" onClick={leave}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Back
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={leave}
            className="h-7 w-7 p-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              vs Computer · {state.size}×{state.size}
            </p>
            <h1 className="text-base font-bold leading-tight">Dots & Boxes</h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={restart}
          className="h-7 px-2 text-xs"
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Restart
        </Button>
      </div>

      <div
        className={cn(
          "shrink-0 rounded-lg border px-3 py-1.5 text-center",
          isMyTurn
            ? "border-accent bg-accent/10"
            : "border-blue-500/30 bg-blue-500/10"
        )}
      >
        <p
          className={cn(
            "flex items-center justify-center gap-1.5 text-xs font-medium",
            isMyTurn ? "text-accent" : "text-blue-500"
          )}
        >
          {isMyTurn ? (
            "🎯 Your turn — drag a line"
          ) : (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Computer is thinking…
            </>
          )}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <DotsBoard
          state={{
            id: "vs-computer",
            roomId: "vs-computer",
            size: state.size,
            horizontal: state.horizontal,
            vertical: state.vertical,
            lineOwners: state.lineOwners,
            boxes: state.boxes,
            playerColors: state.players.reduce(
              (acc, p) => ({ ...acc, [p.id]: p.color }),
              {}
            ),
            playerLetters: state.players.reduce(
              (acc, p) => ({ ...acc, [p.id]: p.label }),
              {}
            ),
            turnOrder: state.players.map((p) => p.id),
            currentTurn: state.currentTurn,
            lastLineType: state.lastLineType,
            lastLineIdx: state.lastLineIdx,
            winnerId: state.winnerId,
            turnStartedAt: new Date().toISOString(),
            finished: state.finished,
          }}
          currentUserId="p1"
          canDraw={isMyTurn && !botThinking}
          onDraw={handleDraw}
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
        {state.players.map((p, i) => {
          const isCurrent = i === state.currentTurn;
          return (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2 py-0.5",
                isCurrent ? "border-accent bg-accent/10" : "bg-card"
              )}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.label}
              </span>
              <span className="text-[10px] font-medium">{p.name}</span>
              <span className="text-[10px] text-muted-foreground">
                ({boxCounts[p.id] ?? 0})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}