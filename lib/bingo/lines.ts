// Pre-computed line definitions on a 5×5 grid (index 0..24, row-major)
// Each line is an array of 5 indices.

export const ROWS: number[][] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
];

export const COLS: number[][] = [
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
];

export const DIAGS: number[][] = [
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
];

export const ALL_LINES: number[][] = [...ROWS, ...COLS, ...DIAGS];

/**
 * Count how many complete lines exist given a set of marked indices.
 */
export function countLines(marked: number[]): number {
  const set = new Set(marked);
  let count = 0;
  for (const line of ALL_LINES) {
    if (line.every((i) => set.has(i))) count++;
  }
  return count;
}

/**
 * Return the indices of all completed lines (useful for highlighting).
 */
export function completedLines(marked: number[]): number[][] {
  const set = new Set(marked);
  return ALL_LINES.filter((line) => line.every((i) => set.has(i)));
}

export const LINES_TO_WIN = 5;