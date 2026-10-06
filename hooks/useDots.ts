"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface DotsBox {
  playerId: string;
  letter: string;
  color: string;
}

export interface DotsGameState {
  id: string;
  roomId: string;
  size: number;
  horizontal: number[];
  vertical: number[];
  lineOwners: Record<string, string>;
  boxes: Record<string, DotsBox>;
  playerColors: Record<string, string>;
  playerLetters: Record<string, string>;
  turnOrder: string[];
  currentTurn: number;
  lastLineType: "h" | "v" | null;
  lastLineIdx: number | null;
  winnerId: string | null;
  turnStartedAt: string;
  finished: boolean;
}

export function useDots(roomCode: string | null) {
  const [state, setState] = useState<DotsGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchState = useCallback(async () => {
    if (!roomCode) return;
    try {
      const res = await fetch(`/api/rooms/${roomCode}/dots`);
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

  // Poll every 3s to drive server-side timeout checks
  useEffect(() => {
    if (!state) return;
    if (state.finished) return;

    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [fetchState, state]);

  // Realtime subscription
  useEffect(() => {
    if (!roomCode) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`dots:${roomCode.toUpperCase()}`)
      .on("broadcast", { event: "state_update" }, () => {
        fetchState();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
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

  const drawLine = useCallback(
    async (type: "h" | "v", index: number) => {
      if (!roomCode || drawing) return { error: "Busy" };
      setDrawing(true);
      try {
        const res = await fetch(`/api/rooms/${roomCode}/dots/draw`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, index }),
        });
        const data = await res.json();
        if (!res.ok) {
          setDrawing(false);
          return { error: data.error ?? "Failed to draw" };
        }
        if (data.state) setState(data.state);
        await broadcastUpdate();
        setDrawing(false);
        return { error: null };
      } catch {
        setDrawing(false);
        return { error: "Network error" };
      }
    },
    [roomCode, drawing, broadcastUpdate]
  );

  return {
    state,
    loading,
    drawing,
    drawLine,
    refresh: fetchState,
  };
}