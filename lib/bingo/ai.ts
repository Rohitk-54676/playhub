import { countLines } from "./lines";

/**
 * Choose the best cell for the bot to pick.
 *
 * Strategy:
 *  - Simulate marking each unmarked, uncalled cell.
 *  - Score by resulting line count.
 *  - Pick highest; random tie-break.
 *  - If all unmarked cells are called (rare), fall back to random unmarked.
 */
export function chooseBotPick(
  numbers: number[],
  marked: number[],
  calledNumbers: number[]
): number {
  const calledSet = new Set(calledNumbers);
  const unmarked: number[] = [];

  for (let i = 0; i < 25; i++) {
    if (marked.includes(i)) continue;
    if (calledSet.has(numbers[i])) continue;
    unmarked.push(i);
  }

  if (unmarked.length === 0) return -1;

  let bestCells: number[] = [];
  let bestScore = -1;

  for (const cell of unmarked) {
    const simulated = [...marked, cell];
    const score = countLines(simulated);
    if (score > bestScore) {
      bestScore = score;
      bestCells = [cell];
    } else if (score === bestScore) {
      bestCells.push(cell);
    }
  }

  return bestCells[Math.floor(Math.random() * bestCells.length)];
}

export const BOT_USERNAME = "playhub_bot";