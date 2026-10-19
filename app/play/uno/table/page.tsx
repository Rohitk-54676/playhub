"use client";

import { useEffect, useState } from "react";
import { UnoTable } from "@/components/uno/UnoTable";
import { UnoHand } from "@/components/uno/UnoHand";
import { ActionLog, type LogEntry } from "@/components/uno/ActionLog";
import { startUnoGame, playCard } from "@/lib/uno/engine";
import { Button } from "@/components/ui/button";
import type { UnoGameState } from "@/lib/uno/types";

const PLAYER_INFO = {
  p1: { username: "rohit", display_name: "Rohit", avatar_url: null },
  p2: { username: "alice", display_name: "Alice", avatar_url: null },
  p3: { username: "bob", display_name: "Bob", avatar_url: null },
  p4: { username: "carol", display_name: "Carol", avatar_url: null },
};

export default function UnoTableTestPage() {
  const [state, setState] = useState<UnoGameState | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setState(startUnoGame(["p1", "p2", "p3", "p4"]));
  }, []);

  function addLog(text: string) {
    setLog((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        text,
        at: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  function handlePlayCard(cardId: string) {
    if (!state) return;
    const card = state.players[0].hand.find((c) => c.id === cardId);
    const { newState, error } = playCard(state, "p1", cardId);
    if (error) {
      addLog(`❌ ${error}`);
      return;
    }
    addLog(
      `Rohit played ${card?.color ?? ""} ${card?.type ?? ""}${
        card?.value !== undefined ? ` ${card.value}` : ""
      }`
    );
    setState(newState);
  }

  function handleDraw() {
    addLog("Rohit drew a card");
  }

  function handleRestart() {
    setState(startUnoGame(["p1", "p2", "p3", "p4"]));
    setLog([]);
  }

  if (!mounted || !state) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading table…
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      {/* Felt table background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-900 via-emerald-900 to-green-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.25),_transparent_70%)]" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Table area (opponents + piles) */}
        <div className="flex-1 overflow-hidden">
          <UnoTable
            state={state}
            myPlayerId="p1"
            playerInfo={PLAYER_INFO}
            hostId="p1"
            onDrawPileClick={handleDraw}
          />
        </div>

        {/* Hand area */}
        <div className="shrink-0 bg-gradient-to-t from-black/40 to-transparent pt-2">
          <UnoHand
            state={state}
            myPlayerId="p1"
            canPlay={state.players[state.currentPlayerIndex].id === "p1"}
            onPlayCard={handlePlayCard}
          />
        </div>
      </div>

      {/* Action log — top right */}
      <div className="absolute right-3 top-3 z-20">
        <ActionLog entries={log} />
      </div>

      {/* Restart — bottom right */}
      <div className="absolute bottom-4 right-3 z-20">
        <Button
          size="sm"
          variant="outline"
          onClick={handleRestart}
          className="bg-background/60 backdrop-blur"
        >
          Restart
        </Button>
      </div>
    </div>
  );
}