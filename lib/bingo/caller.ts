export interface Player {
  userId: string;
  joinedAt: Date;
}

/**
 * Return whose turn it is given the number of picks already made.
 */
export function currentPicker(
  players: Player[],
  picksSoFar: number
): string | null {
  if (players.length === 0) return null;
  return players[picksSoFar % players.length].userId;
}

/**
 * Which index in the turn order are we at?
 */
export function currentTurnIndex(
  players: Player[],
  picksSoFar: number
): number {
  if (players.length === 0) return 0;
  return picksSoFar % players.length;
}

/**
 * Random unmarked cell on a card, used when timer expires.
 */
export function randomUnmarkedCell(marked: number[]): number {
  const unmarked = Array.from({ length: 25 }, (_, i) => i).filter(
    (i) => !marked.includes(i)
  );
  if (unmarked.length === 0) return -1;
  return unmarked[Math.floor(Math.random() * unmarked.length)];
}