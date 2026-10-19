import type { UnoCard, UnoColor } from "./types";

const COLORS: UnoColor[] = ["red", "yellow", "green", "blue"];

let cardCounter = 0;
function makeCard(
  color: UnoCard["color"],
  type: UnoCard["type"],
  value?: number
): UnoCard {
  cardCounter += 1;
  return {
    id: `${color}-${type}${value !== undefined ? `-${value}` : ""}-${cardCounter}`,
    color,
    type,
    value,
  };
}

/**
 * Generate a standard 108-card Uno deck.
 *
 * Composition per color (25 cards × 4 colors = 100):
 *   - 1 zero
 *   - 2 each of 1-9
 *   - 2 Skip
 *   - 2 Reverse
 *   - 2 Draw Two
 *
 * Plus 8 wilds:
 *   - 4 Wild
 *   - 4 Wild Draw Four
 */
export function generateDeck(): UnoCard[] {
  const deck: UnoCard[] = [];

  for (const color of COLORS) {
    // Zero: 1 copy
    deck.push(makeCard(color, "number", 0));

    // 1-9: 2 copies each
    for (let n = 1; n <= 9; n++) {
      deck.push(makeCard(color, "number", n));
      deck.push(makeCard(color, "number", n));
    }

    // Action cards: 2 copies each
    deck.push(makeCard(color, "skip"));
    deck.push(makeCard(color, "skip"));
    deck.push(makeCard(color, "reverse"));
    deck.push(makeCard(color, "reverse"));
    deck.push(makeCard(color, "draw_two"));
    deck.push(makeCard(color, "draw_two"));
  }

  // Wilds
  for (let i = 0; i < 4; i++) {
    deck.push(makeCard("wild", "wild"));
    deck.push(makeCard("wild", "wild_draw_four"));
  }

  // Reset counter for next game
  cardCounter = 0;

  return deck;
}

/** Fisher-Yates shuffle — returns a new array. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick a random starting card from the deck.
 * Standard Uno rule: the first discard cannot be a Wild Draw Four.
 * If it is, we reshuffle it back into the deck.
 */
export function pickStartingCard(deck: UnoCard[]): {
  startingCard: UnoCard;
  remaining: UnoCard[];
} {
  const shuffled = shuffle(deck);
  let idx = 0;

  while (shuffled[idx].type === "wild_draw_four") {
    idx++;
    if (idx >= shuffled.length) {
      // Extremely unlikely, but fallback
      idx = 0;
      break;
    }
  }

  const startingCard = shuffled[idx];
  const remaining = shuffled.filter((_, i) => i !== idx);
  return { startingCard, remaining };
}