"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, RotateCcw } from "lucide-react";
import { DotsBoard } from "@/components/dots/DotsBoard";
import { Button } from "@/components/ui/button";
import { useSound } from "@/hooks/useSound";
import { useOfflineDots } from "@/hooks/useOfflineDots";
import { playerBoxCounts } from "@/lib/dots/offline";
import { toast } from "sonner";

export default function OfflineGamePage() {
  const router = useRouter();
  const { play } = useSound();
  const { state, draw, reset } = useOfflineDots();
  const prevBoxCount = useRef(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Small delay to allow localStorage to hydrate
    const t = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Redirect to setup if no state
  useEffect(() => {
    if (ready && !state) {
      router.replace("/play/dots-and-boxes/offline");
    }
  }, [ready, state, router]);

  // Play sound on box completion
  useEffect(() => {
    if (!state) return;
    const count = Object.keys(state.boxes).length;
    if (count > prevBoxCount.current && prevBoxCount.current > 0) {
      play("mark");
    }
    prevBoxCount.current = count;
  }, [state, play]);

  // Play win sound
  useEffect(() => {
    if (state?.finished) {
      play("win");
    }
  }, [state?.finished, play]);

  if (!state) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const currentPlayer = state.players[state.currentTurn];
  const boxCounts = playerBoxCounts(state);

  function handleDraw(type: "h" | "v", index: number) {
    if (!state) return;
    if (state.finished) return;
    draw(type, index);
    play("pick");
  }

  function handleRestart() {
    reset();
    router.push("/play/dots-and-boxes/offline");
  }

  function handleLeave() {
    reset();
    router.push("/play/dots-and-boxes");
  }

  // Winner screen
  if (state.finished) {
    let winnerId = state.winnerId;
    let tied = false;
    if (!winnerId) {
      // Compute
      const counts = playerBoxCounts(state);
      let max = -1;
      let countMax = 0;
      for (const count of Object.values(counts)) {
        if (count > max) {
          max = count;
          countMax = 1;
        } else if (count === max) {
          countMax++;
        }
      }
      if (countMax > 1) tied = true;
      else {
        const entry = Object.entries(counts).find(([, c]) => c === max);
        winnerId = entry?.[0] ?? null;
      }
    }
    const winner = state.players.find((p) => p.id === winnerId);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex h-full flex-col items-center justify-center gap-5 text-center"
      >
        <div className="text-5xl">🎉</div>
        <div>
          <h1 className="text-2xl font-bold">
            {tied ? "It's a tie!" : `${winner?.name ?? "Someone"} won!`}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {!tied && winnerId ? `${boxCounts[winnerId] ?? 0} boxes` : ""}
          </p>
        </div>

        {/* Standings */}
        <div className="flex flex-wrap justify-center gap-2">
          {state.players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1"
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.label}
              </span>
              <span className="text-[11px] font-medium">{p.name}</span>
              <span className="text-[11px] text-muted-foreground">
                ({boxCounts[p.id] ?? 0})
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleRestart}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Play Again
          </Button>
          <Button variant="outline" onClick={handleLeave}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Back
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Header */}
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
              Offline · {state.players.length} players
            </p>
            <h1 className="text-base font-bold leading-tight">Dots & Boxes</h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestart}
          className="h-7 px-2 text-xs"
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Restart
        </Button>
      </div>

      {/* Turn indicator */}
      <div
        className="shrink-0 rounded-lg border px-3 py-1.5 text-center"
        style={{
          borderColor: currentPlayer.color,
          backgroundColor: `${currentPlayer.color}15`,
        }}
      >
        <p className="text-xs font-medium" style={{ color: currentPlayer.color }}>
          🎯{" "}
          <span className="font-bold">{currentPlayer.name}</span>
          {" "}({currentPlayer.label}) — your turn
        </p>
      </div>

      {/* Board */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <DotsBoard
          state={{
            id: "offline",
            roomId: "offline",
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
          currentUserId={currentPlayer.id}
          canDraw={!state.finished}
          onDraw={handleDraw}
        />
      </div>

      {/* Players bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
        {state.players.map((p, i) => {
          const isCurrent = i === state.currentTurn;
          const count = boxCounts[p.id] ?? 0;
          return (
            <div
              key={p.id}
              className="flex items-center gap-1.5 rounded-full border px-2 py-0.5"
              style={{
                borderColor: isCurrent ? p.color : undefined,
                backgroundColor: isCurrent ? `${p.color}15` : undefined,
              }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: p.color }}
              >
                {p.label}
              </span>
              <span className="text-[10px] font-medium">{p.name}</span>
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