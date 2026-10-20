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

export function startUnoGame(playerIds: string[]): UnoGameState {
  if (playerIds.length < 2 || playerIds.length > 6) {
    throw new Error("Uno requires 2–6 players");
  }

  const deck = generateDeck();
  const { startingCard, remaining } = pickStartingCard(deck);

  const drawPile = shuffle(remaining);

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
    turnStartedAt: new Date().toISOString(),
  };
}

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

  if (state.pendingType && state.pendingPlayerId === playerId) {
    return {
      newState: state,
      error: "You must respond to the pending draw first",
    };
  }

  if (isWild(card)) {
    if (!chosenColor) {
      return { newState: state, error: "Must choose a color for Wild" };
    }
    if (!["red", "yellow", "green", "blue"].includes(chosenColor)) {
      return { newState: state, error: "Invalid color" };
    }
  }

  if (!canPlayCard(card, top, state.currentColor, currentPlayer.hand)) {
    return { newState: state, error: "Cannot play that card" };
  }

  const newPlayers = state.players.map((p) => ({
    ...p,
    hand: p.id === playerId ? p.hand.filter((c) => c.id !== cardId) : [...p.hand],
  }));

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

  switch (card.type) {
    case "skip": {
      newState = {
        ...newState,
        currentPlayerIndex: advanceBy(newState, 2), // Skips the next active player
      };
      break;
    }
    case "reverse": {
      if (newState.players.length === 2) {
        newState = {
          ...newState,
          direction: (newState.direction * -1) as -1 | 1,
          currentPlayerIndex: advanceBy(newState, 2), // Acts as skip
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
      const nextIdx = advanceBy(newState, 1);
      const next = newState.players[nextIdx];
      const drawn = drawCards(newState, next.id, 2);
      newState = {
        ...drawn,
        pendingDraw: 0,
        pendingType: null,
        pendingPlayerId: null,
        wildDrawFourChallengeOpen: false,
        currentPlayerIndex: advanceBy(drawn, 2), // Skip the penalized player
      };
      break;
    }
    case "wild_draw_four": {
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

  const { state: finished } = checkFinish(newState);
  newState = finished;

  return { newState };
}

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

export function endTurn(state: UnoGameState, playerId: string): UnoGameState {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) return state;

  return {
    ...state,
    currentPlayerIndex: advanceBy(state, 1),
    turnStartedAt: new Date().toISOString(),
  };
}

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
    drawnState = drawCards(state, playerWhoPlayed, 4);
  } else {
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

/** 
 * The most important fix: advanceBy SKIPS finished players.
 * If a player has 0 cards, they are effectively invisible to the turn engine.
 */
function advanceBy(state: UnoGameState, steps: number): number {
  const n = state.players.length;
  let idx = state.currentPlayerIndex;
  let moved = 0;

  // Safety guard to prevent infinite loops if everyone is finished
  let loops = 0;

  while (moved < steps && loops < n * steps + 10) {
    idx = (idx + state.direction + n) % n;
    if (!state.players[idx].finished) {
      moved++;
    }
    loops++;
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