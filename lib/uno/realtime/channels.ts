/**
 * Public room channel. Everyone in the game subscribes.
 */
export function roomChannel(roomCode: string): string {
  return `uno-${roomCode.toUpperCase()}`;
}

/**
 * Private per-player channel. Only that player subscribes.
 * Uses a shortened hash of playerId to avoid channel name length limits.
 */
export function playerChannel(roomCode: string, playerId: string): string {
  // Short hash — first 8 chars of playerId is enough for uniqueness in one room
  const short = playerId.replace(/-/g, "").slice(0, 8);
  return `uno-${roomCode.toUpperCase()}-${short}`;
}