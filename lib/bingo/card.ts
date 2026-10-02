// Column ranges
const COL_RANGES = [
  [1, 15],   // B
  [16, 30],  // I
  [31, 45],  // N
  [46, 60],  // G
  [61, 75],  // O
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate a 5×5 bingo card.
 * Returns array of 25 numbers in row-major order:
 *   index 0..4   = row 0
 *   index 5..9   = row 1
 *   ...
 * Column C is filled with 5 unique numbers from COL_RANGES[C].
 */
export function generateCard(): number[] {
  const columns: number[][] = COL_RANGES.map(([min, max]) => {
    const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return shuffle(pool).slice(0, 5);
  });

  const numbers: number[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      numbers.push(columns[col][row]);
    }
  }
  return numbers;
}

/** Return a shuffled order of 0..24 for picking order */
export function shuffledIndices(): number[] {
  return shuffle(Array.from({ length: 25 }, (_, i) => i));
}