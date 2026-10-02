import { countLines, completedLines, LINES_TO_WIN } from "./lines";

/**
 * Given a card's marked indices, determine if the player has won.
 */
export function hasWon(marked: number[]): boolean {
  return countLines(marked) >= LINES_TO_WIN;
}

export function getWinningLines(marked: number[]): number[][] {
  return completedLines(marked);
}

/**
 * Server-side validation when a player presses BINGO.
 */
export function validateBingo(marked: number[]): {
  valid: boolean;
  lines: number;
} {
  const lines = countLines(marked);
  return { valid: lines >= LINES_TO_WIN, lines };
}