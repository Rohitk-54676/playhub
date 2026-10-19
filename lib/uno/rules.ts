import type {
  UnoCard,
  UnoColor,
  UnoGameState,
  UnoPlayer,
} from "./types";

/** Is this card wild (Wild or Wild Draw Four)? */
export function isWild(card: UnoCard): boolean {
  return card.type === "wild" || card.type === "wild_draw_four";
}

/** Is this a number card? */
export function isNumberCard(card: UnoCard): boolean {
  return card.type === "number";
}

/**
 * Can this card be played on top of `topCard` with `activeColor`?
 * Rule:
 *   - Wild → always playable (choose a color)
 *   - Wild Draw Four → only if no card in hand matches the active color
 *   - Otherwise → matches active color OR matches topCard's number/type
 */
export function canPlayCard(
  card: UnoCard,
  topCard: UnoCard,
  activeColor: UnoColor,
  hand: UnoCard[]
): boolean {
  if (!topCard) return true;

  // Wild — always playable
  if (card.type === "wild") return true;

  // Wild Draw Four — restricted
  if (card.type === "wild_draw_four") {
    const hasMatchingColor = hand.some(
      (c) => c.id !== card.id && c.color === activeColor
    );
    return !hasMatchingColor;
  }

  // Match by active color
  if (card.color === activeColor) return true;

  // Match by number
  if (card.type === "number" && topCard.type === "number") {
    return card.value === topCard.value;
  }

  // Match by type (skip/reverse/draw_two)
  if (card.type !== "number" && card.type === topCard.type) {
    return true;
  }

  return false;
}

/** Get all playable cards from a hand. */
export function playableCards(
  hand: UnoCard[],
  topCard: UnoCard,
  activeColor: UnoColor
): UnoCard[] {
  return hand.filter((c) => canPlayCard(c, topCard, activeColor, hand));
}

/** Top of the discard pile. */
export function topCard(state: UnoGameState): UnoCard {
  return state.discardPile[state.discardPile.length - 1];
}

/** Find a player by id. */
export function findPlayer(
  state: UnoGameState,
  playerId: string
): UnoPlayer | undefined {
  return state.players.find((p) => p.id === playerId);
}

/** Advance the current player index by `steps` in the current direction. */
export function advanceTurn(state: UnoGameState, steps = 1): number {
  const n = state.players.length;
  let idx = state.currentPlayerIndex;
  for (let i = 0; i < steps; i++) {
    idx = (idx + state.direction + n) % n;
  }
  return idx;
}

/** Skip the next player (advance 2 turns). */
export function skipNextPlayer(state: UnoGameState): number {
  return advanceTurn(state, 2);
}

/**
 * Draw `count` cards from the draw pile into a player's hand.
 * Reshuffles the discard pile (minus top) when the draw pile runs out.
 */
export function drawCards(
  state: UnoGameState,
  playerId: string,
  count: number
): UnoGameState {
  const newState: UnoGameState = {
    ...state,
    players: state.players.map((p) => ({ ...p, hand: [...p.hand] })),
    drawPile: [...state.drawPile],
    discardPile: [...state.discardPile],
  };

  const player = newState.players.find((p) => p.id === playerId);
  if (!player) return newState;

  for (let i = 0; i < count; i++) {
    if (newState.drawPile.length === 0) {
      if (newState.discardPile.length <= 1) {
        break;
      }
      const top = newState.discardPile[newState.discardPile.length - 1];
      const rest = newState.discardPile.slice(0, -1);
      newState.drawPile = shuffle(rest);
      newState.discardPile = [top];
    }
    const card = newState.drawPile.pop();
    if (card) player.hand.push(card);
  }

  return newState;
}

/** Apply Skip: advance 2 turns. */
export function applySkip(state: UnoGameState): UnoGameState {
  return { ...state, currentPlayerIndex: skipNextPlayer(state) };
}

/** Apply Reverse: flip direction. Acts as Skip with 2 players. */
export function applyReverse(state: UnoGameState): UnoGameState {
  if (state.players.length === 2) {
    return {
      ...state,
      direction: (state.direction * -1) as -1 | 1,
      currentPlayerIndex: skipNextPlayer(state),
    };
  }
  return {
    ...state,
    direction: (state.direction * -1) as -1 | 1,
    currentPlayerIndex: advanceTurn(state, 1),
  };
}

/** Fisher-Yates. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Mark finished players and compute placements.
 * Game ends when only 1 player remains (or all finish).
 */
export function checkFinish(state: UnoGameState): {
  state: UnoGameState;
  justFinished: UnoPlayer | null;
} {
  const newState: UnoGameState = {
    ...state,
    players: state.players.map((p) => ({ ...p })),
  };

  let justFinished: UnoPlayer | null = null;
  let nextPlacement =
    Math.max(0, ...newState.players.map((p) => p.placement ?? 0)) + 1;

  for (const p of newState.players) {
    if (!p.finished && p.hand.length === 0) {
      p.finished = true;
      p.placement = nextPlacement;
      justFinished = p;
      nextPlacement++;
    }
  }

  const remaining = newState.players.filter((p) => !p.finished);

  if (remaining.length === 1) {
    remaining[0].finished = true;
    remaining[0].placement = nextPlacement;
    newState.phase = "finished";
    newState.winner =
      newState.players.find((p) => p.placement === 1)?.id ?? null;
  } else if (remaining.length === 0) {
    newState.phase = "finished";
    newState.winner =
      newState.players.find((p) => p.placement === 1)?.id ?? null;
  }

  return { state: newState, justFinished };
}

/** Reshuffle discard pile into draw pile if draw pile is empty. */
export function ensureDrawPile(state: UnoGameState): UnoGameState {
  if (state.drawPile.length > 0) return state;
  if (state.discardPile.length <= 1) return state;

  const top = state.discardPile[state.discardPile.length - 1];
  const rest = state.discardPile.slice(0, -1);
  return {
    ...state,
    drawPile: shuffle(rest),
    discardPile: [top],
  };
}

/** Helper: active color of the current turn (from state). */
export function activeColor(state: UnoGameState): UnoColor {
  return state.currentColor;
}

/** Helper: is the given player the current turn holder? */
export function isCurrentTurn(
  state: UnoGameState,
  playerId: string
): boolean {
  return state.players[state.currentPlayerIndex]?.id === playerId;
}