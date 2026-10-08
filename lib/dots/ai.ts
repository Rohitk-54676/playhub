import { adjacentBoxes, boxLines, totalH, totalV } from "./grid";

/**
 * Count how many sides of a box are already drawn.
 */
function boxSidesDrawn(
  size: number,
  y: number,
  x: number,
  horizontal: Set<number>,
  vertical: Set<number>
): number {
  const { top, bottom, left, right } = boxLines(size, y, x);
  let count = 0;
  if (horizontal.has(top)) count++;
  if (horizontal.has(bottom)) count++;
  if (vertical.has(left)) count++;
  if (vertical.has(right)) count++;
  return count;
}

/**
 * Would drawing this line complete at least one box?
 * Returns the number of boxes that would be completed.
 */
function completesBoxes(
  size: number,
  type: "h" | "v",
  index: number,
  horizontal: Set<number>,
  vertical: Set<number>
): number {
  const testH = new Set(horizontal);
  const testV = new Set(vertical);
  if (type === "h") testH.add(index);
  else testV.add(index);

  const neighbors = adjacentBoxes(size, type, index);
  let completed = 0;
  for (const { y, x } of neighbors) {
    if (boxSidesDrawn(size, y, x, testH, testV) === 4) completed++;
  }
  return completed;
}

/**
 * Would drawing this line create a new 3-sided box (a "gift" to the opponent)?
 */
function createsThreeSided(
  size: number,
  type: "h" | "v",
  index: number,
  horizontal: Set<number>,
  vertical: Set<number>
): boolean {
  const testH = new Set(horizontal);
  const testV = new Set(vertical);
  if (type === "h") testH.add(index);
  else testV.add(index);

  const neighbors = adjacentBoxes(size, type, index);
  for (const { y, x } of neighbors) {
    if (boxSidesDrawn(size, y, x, testH, testV) === 3) return true;
  }
  return false;
}

/**
 * Choose the AI's next line.
 *
 * Strategy:
 *  1. If a line completes 1+ boxes → take the one that completes the most.
 *  2. Else, pick a line that doesn't create a 3-sided box (safe move).
 *  3. Else, pick any available line (forced to give away).
 *
 * Tie-break: random.
 */
export function chooseBotMove(
  size: number,
  horizontal: number[],
  vertical: number[]
): { type: "h" | "v"; index: number } | null {
  const hSet = new Set(horizontal);
  const vSet = new Set(vertical);

  const available: { type: "h" | "v"; index: number }[] = [];
  const totalHs = totalH(size);
  const totalVs = totalV(size);
  for (let i = 0; i < totalHs; i++) {
    if (!hSet.has(i)) available.push({ type: "h", index: i });
  }
  for (let i = 0; i < totalVs; i++) {
    if (!vSet.has(i)) available.push({ type: "v", index: i });
  }

  if (available.length === 0) return null;

  // 1. Completing moves
  const completers: { move: { type: "h" | "v"; index: number }; count: number }[] = [];
  for (const move of available) {
    const count = completesBoxes(size, move.type, move.index, hSet, vSet);
    if (count > 0) completers.push({ move, count });
  }
  if (completers.length > 0) {
    const best = Math.max(...completers.map((c) => c.count));
    const top = completers.filter((c) => c.count === best);
    return top[Math.floor(Math.random() * top.length)].move;
  }

  // 2. Safe moves (don't create 3-sided boxes)
  const safes = available.filter(
    (m) => !createsThreeSided(size, m.type, m.index, hSet, vSet)
  );
  if (safes.length > 0) {
    return safes[Math.floor(Math.random() * safes.length)];
  }

  // 3. Forced — pick any
  return available[Math.floor(Math.random() * available.length)];
}