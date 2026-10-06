import { prisma } from "@/lib/prisma";
import { newlyCompletedBoxes } from "./completion";
import { isValidLine, totalBoxes, totalH, totalV } from "./grid";
import { pickPlayerColors, deriveLetters } from "./colors";

export interface DotsGameState {
  id: string;
  roomId: string;
  size: number;
  horizontal: number[];
  vertical: number[];
  lineOwners: Record<string, string>; // "h:5" → userId
  boxes: Record<
    string,
    { playerId: string; letter: string; color: string }
  >;
  playerColors: Record<string, string>;
  playerLetters: Record<string, string>;
  turnOrder: string[];
  currentTurn: number;
  lastLineType: "h" | "v" | null;
  lastLineIdx: number | null;
  winnerId: string | null;
  turnStartedAt: string;
  finished: boolean;
}

/**
 * Initialize a new dots game for a room.
 * Called when host presses Start in the lobby.
 */
export async function startDotsGame(
  roomId: string,
  size: number
): Promise<DotsGameState> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: {
        orderBy: { joinedAt: "asc" },
        include: { user: true },
      },
    },
  });
  if (!room) throw new Error("Room not found");

  const players = room.players.map((p) => ({
    id: p.userId,
    name: p.user.displayName ?? p.user.username,
  }));

  const colors = pickPlayerColors(players.length);
  const playerColors: Record<string, string> = {};
  players.forEach((p, i) => {
    playerColors[p.id] = colors[i] ?? "#888888";
  });

  const playerLetters = deriveLetters(players);
  const turnOrder = players.map((p) => p.id);

  // Wipe any existing game for this room
  await prisma.dotsGame.deleteMany({ where: { roomId } });

  const game = await prisma.dotsGame.create({
    data: {
      roomId,
      size,
      horizontal: [],
      vertical: [],
      boxes: {},
      lineOwners: {},
      playerColors,
      playerLetters,
      turnOrder,
      currentTurn: 0,
      turnStartedAt: new Date(),
    },
  });

  await prisma.room.update({
    where: { id: roomId },
    data: { status: "playing" },
  });

  return toState(game);
}

function toState(game: {
  id: string;
  roomId: string;
  size: number;
  horizontal: unknown;
  vertical: unknown;
  lineOwners: unknown;
  boxes: unknown;
  playerColors: unknown;
  playerLetters: unknown;
  turnOrder: unknown;
  currentTurn: number;
  lastLineType: string | null;
  lastLineIdx: number | null;
  winnerId: string | null;
  turnStartedAt: Date;
}): DotsGameState {
  return {
    id: game.id,
    roomId: game.roomId,
    size: game.size,
    horizontal: (game.horizontal as number[]) ?? [],
    vertical: (game.vertical as number[]) ?? [],
    boxes:
      (game.boxes as Record<
        string,
        { playerId: string; letter: string; color: string }
      >) ?? {},
    playerColors: (game.playerColors as Record<string, string>) ?? {},
    playerLetters: (game.playerLetters as Record<string, string>) ?? {},
    lineOwners: (game.lineOwners as Record<string, string>) ?? {},
    turnOrder: (game.turnOrder as string[]) ?? [],
    currentTurn: game.currentTurn,
    lastLineType: (game.lastLineType as "h" | "v" | null) ?? null,
    lastLineIdx: game.lastLineIdx,
    winnerId: game.winnerId,
    turnStartedAt: game.turnStartedAt.toISOString(),
    finished: game.winnerId !== null,
  };
}

export async function loadDotsState(
  roomId: string
): Promise<DotsGameState | null> {
  const game = await prisma.dotsGame.findUnique({ where: { roomId } });
  if (!game) return null;
  return toState(game);
}

/**
 * Apply a draw by a player.
 * - Validates: their turn, line not drawn, valid index
 * - Adds line to horizontal/vertical
 * - Checks for completed boxes
 * - If any box completed → they get another turn
 * - Otherwise → advance turn
 * - If all lines drawn → compute winner
 */
export async function applyDraw(
  roomId: string,
  userId: string,
  type: "h" | "v",
  index: number
): Promise<{ state: DotsGameState; error?: string }> {
  const game = await prisma.dotsGame.findUnique({ where: { roomId } });
  if (!game) {
    return { state: {} as DotsGameState, error: "Game not found" };
  }

  const state = toState(game);

  if (state.finished) {
    return { state, error: "Game already finished" };
  }

  const currentPlayerId = state.turnOrder[state.currentTurn];
  if (currentPlayerId !== userId) {
    return { state, error: "Not your turn" };
  }

  if (!isValidLine(state.size, type, index)) {
    return { state, error: "Invalid line" };
  }

  const horizontalSet = new Set(state.horizontal);
  const verticalSet = new Set(state.vertical);

  if (type === "h" && horizontalSet.has(index)) {
    return { state, error: "Line already drawn" };
  }
  if (type === "v" && verticalSet.has(index)) {
    return { state, error: "Line already drawn" };
  }

    // Draw the line
  if (type === "h") {
    state.horizontal.push(index);
    horizontalSet.add(index);
    state.lineOwners[`h:${index}`] = userId;
  } else {
    state.vertical.push(index);
    verticalSet.add(index);
    state.lineOwners[`v:${index}`] = userId;
  }

  // Check for completed boxes
  const completedBoxes = newlyCompletedBoxes(
    state.size,
    type,
    index,
    horizontalSet,
    verticalSet
  );

  const playerColor = state.playerColors[userId];
  const playerLetter = state.playerLetters[userId];

  for (const boxIdx of completedBoxes) {
    state.boxes[String(boxIdx)] = {
      playerId: userId,
      letter: playerLetter,
      color: playerColor,
    };
  }

  // Check if the board is full
  const totalLines =
    totalH(state.size) + totalV(state.size);
  const drawnLines = state.horizontal.length + state.vertical.length;
  const boardFull = drawnLines === totalLines;

  // Determine winner if the board is full
  let winnerId: string | null = null;
  if (boardFull) {
    const boxCount: Record<string, number> = {};
    for (const b of Object.values(state.boxes)) {
      boxCount[b.playerId] = (boxCount[b.playerId] ?? 0) + 1;
    }
    let max = -1;
    for (const [pid, count] of Object.entries(boxCount)) {
      if (count > max) {
        max = count;
        winnerId = pid;
      }
    }
    // Tie → no winner (or pick first)
    const counts = Object.values(boxCount);
    if (counts.length > 1 && new Set(counts).size === 1) {
      winnerId = null; // tie
    }
  }

  // Advance turn: if boxes completed, same player keeps turn
  let nextTurn = state.currentTurn;
  if (completedBoxes.length === 0) {
    nextTurn = (state.currentTurn + 1) % state.turnOrder.length;
  }

    const updated = await prisma.dotsGame.update({
    where: { roomId },
    data: {
      horizontal: state.horizontal,
      vertical: state.vertical,
      lineOwners: state.lineOwners,
      boxes: state.boxes,
      currentTurn: nextTurn,
      lastLineType: type,
      lastLineIdx: index,
      winnerId,
      turnStartedAt: new Date(),
    },
  });

  return { state: toState(updated) };
}

/** Count boxes per player. */
export function boxCounts(
  state: DotsGameState
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of state.turnOrder) counts[id] = 0;
  for (const b of Object.values(state.boxes)) {
    counts[b.playerId] = (counts[b.playerId] ?? 0) + 1;
  }
  return counts;
}

export { totalBoxes };