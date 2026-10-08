"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyOfflineDraw,
  createOfflineGame,
  type OfflineDotsState,
} from "@/lib/dots/offline";

const STORAGE_KEY = "playhub_offline_dots";

export function useOfflineDots() {
  const [state, setState] = useState<OfflineDotsState | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as OfflineDotsState;
        if (parsed && parsed.players && !parsed.finished) {
          setState(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist on every change
  useEffect(() => {
    if (!state) return;
    try {
      if (state.finished) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch {
      // ignore
    }
  }, [state]);

  const start = useCallback((playerCount: number, size: number) => {
    const fresh = createOfflineGame(playerCount, size);
    setState(fresh);
    return fresh;
  }, []);

  const draw = useCallback((type: "h" | "v", index: number) => {
    setState((prev) => (prev ? applyOfflineDraw(prev, type, index) : prev));
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(null);
  }, []);

  return { state, start, draw, reset };
}