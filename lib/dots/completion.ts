import { adjacentBoxes, isBoxComplete, boxIndex } from "./grid";

/**
 * Given a just-drawn line, return the list of box indices that are
 * now fully complete.
 */
export function newlyCompletedBoxes(
  size: number,
  type: "h" | "v",
  index: number,
  horizontal: Set<number>,
  vertical: Set<number>
): number[] {
  const candidates = adjacentBoxes(size, type, index);
  const completed: number[] = [];

  for (const { y, x } of candidates) {
    if (isBoxComplete(size, y, x, horizontal, vertical)) {
      completed.push(boxIndex(size, y, x));
    }
  }

  return completed;
}

/**
 * Return list of all valid (undrawn) lines on the board.
 * Useful for AI + auto-draw.
 */
export function allUndrawnLines(
  size: number,
  horizontal: Set<number>,
  vertical: Set<number>
): { type: "h" | "v"; index: number }[] {
  const lines: { type: "h" | "v"; index: number }[] = [];

  const totalH = size * (size - 1);
  for (let i = 0; i < totalH; i++) {
    if (!horizontal.has(i)) lines.push({ type: "h", index: i });
  }

  const totalV = (size - 1) * size;
  for (let i = 0; i < totalV; i++) {
    if (!vertical.has(i)) lines.push({ type: "v", index: i });
  }

  return lines;
}

/** Pick a random undrawn line. */
export function randomUndrawnLine(
  size: number,
  horizontal: Set<number>,
  vertical: Set<number>
): { type: "h" | "v"; index: number } | null {
  const lines = allUndrawnLines(size, horizontal, vertical);
  if (lines.length === 0) return null;
  return lines[Math.floor(Math.random() * lines.length)];
}