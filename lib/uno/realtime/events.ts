import type { UnoGameState } from "../types";

export type UnoEventType =
  | "state_sync"
  | "game_start"
  | "card_played"
  | "card_drawn"
  | "uno_called"
  | "uno_caught"
  | "challenge_resolved"
  | "pending_draw_accepted"
  | "turn_ended"
  | "game_finished";

/**
 * Every Uno event carries the full game state.
 * This keeps all clients perfectly in sync without needing
 * to reconstruct state from event deltas.
 */
export interface UnoEvent {
  /** Event type — used for logging and future per-event logic */
  type: UnoEventType;

  /** ISO timestamp when the event occurred */
  at: string;

  /** Player ID who triggered the event */
  by: string;

  /** Full game state after this event */
  state: UnoGameState;

  /** Optional human-readable log line for the activity feed */
  log?: string;
}