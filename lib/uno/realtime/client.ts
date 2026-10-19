"use client";

import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { playerChannel, roomChannel } from "./channels";
import type { UnoEvent, UnoEventType } from "./events";

type Handler = (event: UnoEvent) => void;

export interface UnoRealtimeClient {
  send: (event: UnoEvent) => Promise<void>;
  sendToPlayer: (playerId: string, event: UnoEvent) => Promise<void>;
  subscribe: (eventType: UnoEventType | "*", handler: Handler) => () => void;
  disconnect: () => Promise<void>;
}

// Must match the UnoEventType union in events.ts exactly
const ALL_EVENTS: UnoEventType[] = [
  "state_sync",
  "game_start",
  "card_played",
  "card_drawn",
  "uno_called",
  "uno_caught",
  "challenge_resolved",
  "pending_draw_accepted",
  "turn_ended",
  "game_finished",
];

export function createUnoClient(
  roomCode: string,
  playerId: string,
  onReconnect?: () => void
): UnoRealtimeClient {
  const supabase = createClient();

  const roomName = roomChannel(roomCode);
  const playerName = playerChannel(roomCode, playerId);

  const roomChan: RealtimeChannel = supabase.channel(roomName);
  const playerChan: RealtimeChannel = supabase.channel(playerName);

  const handlers = new Map<string, Set<Handler>>();

  function fire(event: UnoEvent) {
    handlers.get("*")?.forEach((h) => {
      try {
        h(event);
      } catch (e) {
        console.error("uno handler error:", e);
      }
    });
    handlers.get(event.type)?.forEach((h) => {
      try {
        h(event);
      } catch (e) {
        console.error("uno handler error:", e);
      }
    });
  }

  // Register one listener per event type on BOTH channels
  for (const evt of ALL_EVENTS) {
    roomChan.on("broadcast", { event: evt }, ({ payload }) => {
      const data = payload as UnoEvent;
      if (data && data.type) fire(data);
    });
    playerChan.on("broadcast", { event: evt }, ({ payload }) => {
      const data = payload as UnoEvent;
      if (data && data.type) fire(data);
    });
  }

  // Fire onReconnect from whichever channel subscribes first
  let reconnectFired = false;
  function fireReconnect() {
    if (reconnectFired) return;
    reconnectFired = true;
    onReconnect?.();
  }

  roomChan.subscribe((status) => {
    if (status === "SUBSCRIBED") fireReconnect();
  });

  playerChan.subscribe((status) => {
    if (status === "SUBSCRIBED") fireReconnect();
  });

  return {
    async send(event: UnoEvent) {
      await roomChan.send({
        type: "broadcast",
        event: event.type,
        payload: event,
      });
    },

    async sendToPlayer(targetId: string, event: UnoEvent) {
      if (targetId === playerId) {
        await playerChan.send({
          type: "broadcast",
          event: event.type,
          payload: event,
        });
      }
    },

    subscribe(eventType, handler) {
      if (!handlers.has(eventType)) handlers.set(eventType, new Set());
      handlers.get(eventType)!.add(handler);
      return () => {
        handlers.get(eventType)?.delete(handler);
      };
    },

    async disconnect() {
      await roomChan.unsubscribe();
      await playerChan.unsubscribe();
      handlers.clear();
    },
  };
}