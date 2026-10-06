/** Palette for player colors. Distinct, high-contrast against light and dark. */
export const PLAYER_COLORS = [
  "#a855f7", // purple
  "#3b82f6", // blue
  "#ec4899", // pink
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#8b5cf6", // violet
];

/**
 * Shuffle and pick the first N colors.
 */
export function pickPlayerColors(count: number): string[] {
  const shuffled = [...PLAYER_COLORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Derive a letter for a player from their display name or username.
 * Prefer first character of display name; fallback to username.
 * Uppercase.
 */
export function deriveLetter(name: string): string {
  const clean = (name ?? "").trim();
  if (!clean) return "?";
  return clean[0].toUpperCase();
}

/**
 * Given a list of { userId, name }, return a map userId → letter.
 * If two players share the same first letter, second one gets a fallback.
 */
export function deriveLetters(
  players: { id: string; name: string }[]
): Record<string, string> {
  const result: Record<string, string> = {};
  // For 4 players, use fixed A, B, C, D in turn order — cleaner
  if (players.length === 4) {
    const alpha = ["A", "B", "C", "D"];
    players.forEach((p, i) => {
      result[p.id] = alpha[i];
    });
    return result;
  }
  // Existing logic for 2–3 players
  const used = new Set<string>();
  for (const p of players) {
    let letter = deriveLetter(p.name);
    if (used.has(letter)) {
      const clean = p.name.toUpperCase();
      let found = false;
      for (const c of clean) {
        if (/[A-Z]/.test(c) && !used.has(c)) {
          letter = c;
          found = true;
          break;
        }
      }
      if (!found) {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (const c of alphabet) {
          if (!used.has(c)) {
            letter = c;
            break;
          }
        }
      }
    }
    used.add(letter);
    result[p.id] = letter;
  }
  return result;
}