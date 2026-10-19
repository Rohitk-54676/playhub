import type { UnoGameState } from "./types";

export const TURN_TIMEOUT_MS = 15_000;

/**
 * Returns true if the current player's turn has expired.
 * We derive "turn start" from a timestamp stored in state.turnStartedAt.
 */
export function isTurnExpired(state: UnoGameState): boolean {
  if (state.phase !== "playing") return false;
  if (!state.turnStartedAt) return false;
  const elapsed = Date.now() - new Date(state.turnStartedAt).getTime();
  return elapsed >= TURN_TIMEOUT_MS;
}

/** Seconds remaining on the current turn. */
export function secondsRemaining(state: UnoGameState): number {
  if (!state.turnStartedAt) return TURN_TIMEOUT_MS / 1000;
  const elapsed = Date.now() - new Date(state.turnStartedAt).getTime();
  return Math.max(0, Math.ceil((TURN_TIMEOUT_MS - elapsed) / 1000));
}