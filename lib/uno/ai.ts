import {
  canPlayCard,
  topCard as getTopCard,
  isWild,
} from "./rules";
import type { UnoCard, UnoColor, UnoGameState } from "./types";

/**
 * Pick the best playable card from a hand.
 * Priority:
 *   1. Non-wild card matching the current color (keeps color)
 *   2. Non-wild card matching number/type
 *   3. Wild (choose a color)
 *   4. Wild Draw Four (only if legal)
 * Returns null if no playable card.
 */
export function chooseBestCard(
  hand: UnoCard[],
  state: UnoGameState,
  playerId: string
): { card: UnoCard; chosenColor?: UnoColor } | null {
  const top = getTopCard(state);
  const activeColor = state.currentColor;

  const playables = hand.filter((c) =>
    canPlayCard(c, top, activeColor, hand)
  );
  if (playables.length === 0) return null;

  // Priority 1: non-wild matching current color
  const colorMatch = playables.find(
    (c) => !isWild(c) && c.color === activeColor
  );
  if (colorMatch) return { card: colorMatch };

  // Priority 2: non-wild matching number/type
  const typeMatch = playables.find((c) => !isWild(c));
  if (typeMatch) return { card: typeMatch };

  // Priority 3: Wild
  const wild = playables.find((c) => c.type === "wild");
  if (wild) {
    return {
      card: wild,
      chosenColor: pickDominantColor(hand, playerId),
    };
  }

  // Priority 4: Wild Draw Four
  const wd4 = playables.find((c) => c.type === "wild_draw_four");
  if (wd4) {
    return {
      card: wd4,
      chosenColor: pickDominantColor(hand, playerId),
    };
  }

  return null;
}

/**
 * Pick the most common color in the hand.
 * Falls back to random if no colored cards.
 */
export function pickDominantColor(
  hand: UnoCard[],
  _playerId: string
): UnoColor {
  const counts: Record<UnoColor, number> = {
    red: 0,
    yellow: 0,
    green: 0,
    blue: 0,
  };

  for (const c of hand) {
    if (c.color !== "wild") {
      counts[c.color as UnoColor] += 1;
    }
  }

  let best: UnoColor = "red";
  let max = -1;
  for (const color of Object.keys(counts) as UnoColor[]) {
    if (counts[color] > max) {
      max = counts[color];
      best = color;
    }
  }

  // If all zero, return random
  if (max === 0) {
    const colors: UnoColor[] = ["red", "yellow", "green", "blue"];
    return colors[Math.floor(Math.random() * 4)];
  }

  return best;
}