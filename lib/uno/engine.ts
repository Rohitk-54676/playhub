import {
  canPlayCard,
  checkFinish,
  drawCards,
  findPlayer,
  isWild,
  topCard as getTopCard,
} from "./rules";
import { generateDeck, pickStartingCard, shuffle } from "./deck";
import type {
  PlayResult,
  UnoCard,
  UnoColor,
  UnoGameState,
  UnoPlayer,
} from "./types";

const HAND_SIZE = 7;

/**
 * Start a new Uno game for the given player ids (in turn order).
 */
export function startUnoGame(playerIds: string[]): UnoGameState {
  if (playerIds.length < 2 || playerIds.length > 6) {
    throw new Error("Uno requires 2–6 players");
  }

  const deck = generateDeck();
  const { startingCard, remaining } = pickStartingCard(deck);

  const drawPile = shuffle(remaining);

  // Deal 7 cards to each player
  const players: UnoPlayer[] = playerIds.map((id) => ({
    id,
    hand: [],
    calledUno: false,
    finished: false,
    placement: null,
  }));

  let deckIdx = 0;
  for (let round = 0; round < HAND_SIZE; round++) {
    for (const p of players) {
      const card = drawPile[deckIdx++];
      if (card) p.hand.push(card);
    }
  }

  const finalDrawPile = drawPile.slice(deckIdx);

  // Determine starting color: if starting card is Wild, random color
  let startingColor: UnoColor;
  if (startingCard.color === "wild") {
    const colors: UnoColor[] = ["red", "yellow", "green", "blue"];
    startingColor = colors[Math.floor(Math.random() * 4)];
  } else {
    startingColor = startingCard.color;
  }

    return {
    players,
    drawPile: finalDrawPile,
    discardPile: [startingCard],
    currentPlayerIndex: 0,
    direction: 1,
    currentColor: startingColor,
    phase: "playing",
    pendingDraw: 0,
    pendingType: null,
    pendingPlayerId: null,
    wildDrawFourChallengeOpen: false,
    lastPlayedBy: null,
    winner: null,
    turnStartedAt: new Date().toISOString(), // ← add this
  };
}

/**
 * Play a card from the current player's hand.
 * Validates playability, applies effect, advances turn.
 */
export function playCard(
  state: UnoGameState,
  playerId: string,
  cardId: string,
  chosenColor?: UnoColor
): PlayResult {
  if (state.phase !== "playing") {
    return { newState: state, error: "Game already finished" };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    return { newState: state, error: "Not your turn" };
  }

  const card = currentPlayer.hand.find((c) => c.id === cardId);
  if (!card) {
    return { newState: state, error: "Card not in your hand" };
  }

  const top = getTopCard(state);

  // If there's a pending draw on this player, they must accept it first
  if (state.pendingType && state.pendingPlayerId === playerId) {
    return {
      newState: state,
      error: "You must respond to the pending draw first",
    };
  }

  // Wild cards require a chosen color
  if (isWild(card)) {
    if (!chosenColor) {
      return { newState: state, error: "Must choose a color for Wild" };
    }
    if (!["red", "yellow", "green", "blue"].includes(chosenColor)) {
      return { newState: state, error: "Invalid color" };
    }
  }

  // Validate playability
  if (!canPlayCard(card, top, state.currentColor, currentPlayer.hand)) {
    return { newState: state, error: "Cannot play that card" };
  }

  // Remove card from hand
  const newPlayers = state.players.map((p) => ({
    ...p,
    hand: p.id === playerId ? p.hand.filter((c) => c.id !== cardId) : [...p.hand],
  }));

  // Reset the player's UNO flag whenever they play — they must re-call UNO
  // if they end up at 1 card again.
  const playingPlayer = newPlayers.find((p) => p.id === playerId);
  if (playingPlayer) {
    playingPlayer.calledUno = false;
  }

  let newState: UnoGameState = {
    ...state,
    players: newPlayers,
    discardPile: [...state.discardPile, card],
    lastPlayedBy: playerId,
    currentColor: isWild(card) ? chosenColor! : (card.color as UnoColor),
  };

  // Handle action effects
  switch (card.type) {
    case "skip": {
      newState = {
        ...newState,
        currentPlayerIndex: skipBy(newState, 1),
      };
      break;
    }
    case "reverse": {
      if (newState.players.length === 2) {
        newState = {
          ...newState,
          direction: (newState.direction * -1) as -1 | 1,
          currentPlayerIndex: skipBy(newState, 1),
        };
      } else {
        newState = {
          ...newState,
          direction: (newState.direction * -1) as -1 | 1,
          currentPlayerIndex: advanceBy(newState, 1),
        };
      }
      break;
    }
    case "draw_two": {
      // +2 draws 2 immediately for next player, turn passes to the one after them
      const nextIdx = advanceBy(newState, 1);
      const next = newState.players[nextIdx];
      const drawn = drawCards(newState, next.id, 2);
      newState = {
        ...drawn,
        pendingDraw: 0,
        pendingType: null,
        pendingPlayerId: null,
        wildDrawFourChallengeOpen: false,
        currentPlayerIndex: advanceBy(drawn, 2),
      };
      break;
    }
    case "wild_draw_four": {
      // +4 opens a challenge window for the next player
      const nextIdx = advanceBy(newState, 1);
      const next = newState.players[nextIdx];
      newState = {
        ...newState,
        pendingDraw: 4,
        pendingType: "wild_draw_four",
        pendingPlayerId: next.id,
        wildDrawFourChallengeOpen: true,
        currentPlayerIndex: nextIdx,
      };
      break;
    }
    case "wild":
    case "number":
    default: {
      newState = {
        ...newState,
        currentPlayerIndex: advanceBy(newState, 1),
      };
      break;
    }
  }
  newState = {
    ...newState,
    turnStartedAt: new Date().toISOString(),
  };

  // Check for finish
  const { state: finished } = checkFinish(newState);
  newState = finished;

  return { newState };
}

/**
 * Player draws a card. Returns whether the drawn card is playable.
 * Turn is NOT auto-ended — client decides (play or pass).
 */
export function drawCard(
  state: UnoGameState,
  playerId: string
): {
  newState: UnoGameState;
  drawnCard: UnoCard | null;
  drawnCardPlayable: boolean;
  error?: string;
} {
  if (state.phase !== "playing") {
    return {
      newState: state,
      drawnCard: null,
      drawnCardPlayable: false,
      error: "Game already finished",
    };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    return {
      newState: state,
      drawnCard: null,
      drawnCardPlayable: false,
      error: "Not your turn",
    };
  }

  const after = drawCards(state, playerId, 1);
  const meAfter = after.players.find((p) => p.id === playerId)!;
  const drawn = meAfter.hand[meAfter.hand.length - 1];

  const top = after.discardPile[after.discardPile.length - 1];
  const playable = drawn
    ? canPlayCard(drawn, top, after.currentColor, meAfter.hand)
    : false;

  return {
    newState: after,
    drawnCard: drawn ?? null,
    drawnCardPlayable: playable,
  };
}

/**
 * End the current player's turn without playing (after drawing a card).
 */
export function endTurn(state: UnoGameState, playerId: string): UnoGameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return state;

  return {
    ...state,
    currentPlayerIndex: advanceBy(state, 1),
    turnStartedAt: new Date().toISOString(),
  };
}

/**
 * Player calls UNO after reaching 1 card.
 */
export function callUno(
  state: UnoGameState,
  playerId: string
): UnoGameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return state;
  if (player.hand.length !== 1) return state;

  return {
    ...state,
    players: state.players.map((p) =>
      p.id === playerId ? { ...p, calledUno: true } : p
    ),
  };
}

/**
 * Catch a player who has 1 card and didn't call UNO.
 */
export function catchUno(
  state: UnoGameState,
  targetPlayerId: string
): { newState: UnoGameState; error?: string } {
  const target = state.players.find((p) => p.id === targetPlayerId);
  if (!target) return { newState: state, error: "Player not found" };
  if (target.hand.length !== 1) {
    return { newState: state, error: "Player doesn't have 1 card" };
  }
  if (target.calledUno) {
    return { newState: state, error: "Player already called UNO" };
  }

  const newState = drawCards(state, targetPlayerId, 2);
  return {
    newState: {
      ...newState,
      players: newState.players.map((p) =>
        p.id === targetPlayerId ? { ...p, calledUno: true } : p
      ),
    },
  };
}

/**
 * Current player accepts the pending draw.
 */
export function acceptPendingDraw(
  state: UnoGameState,
  playerId: string
): UnoGameState {
  if (!state.pendingType || state.pendingPlayerId !== playerId) return state;

  const count = state.pendingDraw;
  const drawn = drawCards(state, playerId, count);
  const nextIdx = advanceBy(drawn, 1);

    return {
    ...drawn,
    pendingDraw: 0,
    pendingType: null,
    pendingPlayerId: null,
    wildDrawFourChallengeOpen: false,
    currentPlayerIndex: nextIdx,
    turnStartedAt: new Date().toISOString(),
  };
}

/**
 * Next player challenges a Wild Draw Four.
 */
export function challengeWildDrawFour(
  state: UnoGameState,
  challengerId: string
): { newState: UnoGameState; result: "guilty" | "innocent"; error?: string } {
  if (!state.wildDrawFourChallengeOpen) {
    return { newState: state, result: "innocent", error: "No challenge open" };
  }
  if (state.pendingType !== "wild_draw_four") {
    return { newState: state, result: "innocent", error: "Wrong pending type" };
  }
  if (state.pendingPlayerId !== challengerId) {
    return { newState: state, result: "innocent", error: "Not your challenge" };
  }

  const playerWhoPlayed = state.lastPlayedBy;
  if (!playerWhoPlayed) {
    return { newState: state, result: "innocent", error: "No last player" };
  }

  const cardBelowTop = state.discardPile[state.discardPile.length - 2];
  const activeColorBeforeWild: UnoColor | null =
    cardBelowTop && cardBelowTop.color !== "wild"
      ? (cardBelowTop.color as UnoColor)
      : null;

  const played = state.players.find((p) => p.id === playerWhoPlayed);
  if (!played) {
    return { newState: state, result: "innocent", error: "Player missing" };
  }

  const hadMatchingColor = activeColorBeforeWild
    ? played.hand.some(
        (c) => c.color === activeColorBeforeWild && !isWild(c)
      )
    : false;

  let drawnState: UnoGameState;

  if (hadMatchingColor) {
    // Player was guilty — they draw 4
    drawnState = drawCards(state, playerWhoPlayed, 4);
  } else {
    // Challenger was wrong — they draw 6
    drawnState = drawCards(state, challengerId, 6);
  }

  const nextIdx = advanceBy(drawnState, 1);

  return {
        newState: {
      ...drawnState,
      pendingDraw: 0,
      pendingType: null,
      pendingPlayerId: null,
      wildDrawFourChallengeOpen: false,
      currentPlayerIndex: nextIdx,
      lastPlayedBy: challengerId,
      turnStartedAt: new Date().toISOString(),
    },
    result: hadMatchingColor ? "guilty" : "innocent",
  };
}

/** Helpers */

function advanceBy(state: UnoGameState, steps: number): number {
  const n = state.players.length;
  let idx = state.currentPlayerIndex;
  for (let i = 0; i < steps; i++) {
    idx = (idx + state.direction + n) % n;
  }
  return idx;
}

function skipBy(state: UnoGameState, skip: number): number {
  return advanceBy(state, skip + 1);
}

function nextPlayer(state: UnoGameState): UnoPlayer {
  const idx = advanceBy(state, 1);
  return state.players[idx];
}

export { findPlayer };