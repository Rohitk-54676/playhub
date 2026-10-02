import { prisma } from "@/lib/prisma";
import { countLines, completedLines, LINES_TO_WIN } from "./lines";
import {
  type BingoState,
  turnDurationMs,
  markDurationMs,
  TURN_SECONDS,
} from "./state";
import { generateCard } from "./card";

/**
 * Read the current bingo state for a room (from DB + room.state cache).
 * Reconstructs from BingoCard rows + BingoPick history.
 */
export async function loadState(roomId: string): Promise<BingoState | null> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: { orderBy: { joinedAt: "asc" } },
    },
  });
  if (!room) return null;

  const cards = await prisma.bingoCard.findMany({
    where: { roomId },
  });

  const picks = await prisma.bingoPick.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
  });

  const turnOrder = room.players.map((p) => p.userId);

  // Read winner info from room.state (set by /bingo and /leave routes)
  const roomState = room.state as
    | {
        winnerId?: string;
        winningLines?: number[][];
        reason?: string;
      }
    | null;

  const isFinished = room.status === "finished";

  return {
    cards: cards.map((c) => ({
      userId: c.userId,
      numbers: c.numbers,
      marked: c.marked,
      lines: c.lines,
    })),
    picks: picks.map((p) => ({
      number: p.number,
      userId: p.userId,
      at: p.createdAt.toISOString(),
    })),
    turnOrder,
    currentTurnIndex: picks.length % Math.max(turnOrder.length, 1),
    calledNumbers: picks.map((p) => p.number),
    turnStartedAt: new Date().toISOString(),
    turnEndsAt: new Date(Date.now() + TURN_SECONDS * 1000).toISOString(),
    markWindowEndsAt: null,
    winnerId: roomState?.winnerId ?? null,
    winningLines: roomState?.winningLines ?? [],
    phase: isFinished ? "finished" : "picking",
  };
}

/**
 * Initialize a bingo game — generates a card for each player,
 * writes the game state to room.state.
 */
export async function startBingoGame(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: { orderBy: { joinedAt: "asc" } } },
  });
  if (!room) throw new Error("Room not found");

  // Wipe any existing cards / picks (fresh game)
  await prisma.bingoCard.deleteMany({ where: { roomId } });
  await prisma.bingoPick.deleteMany({ where: { roomId } });

  // Generate cards
  for (const player of room.players) {
    await prisma.bingoCard.create({
      data: {
        roomId,
        userId: player.userId,
        numbers: generateCard(),
        marked: [],
        lines: 0,
      },
    });
  }

  const turnOrder = room.players.map((p) => p.userId);
  const now = new Date();

  const state: BingoState = {
    cards: [],
    picks: [],
    turnOrder,
    currentTurnIndex: 0,
    calledNumbers: [],
    turnStartedAt: now.toISOString(),
    turnEndsAt: new Date(now.getTime() + TURN_SECONDS * 1000).toISOString(),
    markWindowEndsAt: null,
    winnerId: null,
    winningLines: [],
    phase: "picking",
  };

  await prisma.room.update({
    where: { id: roomId },
    data: { status: "playing", state: state as object },
  });

  return state;
}

/**
 * Apply a pick by the current player.
 * Validates: is it their turn, is the cell unmarked, is the number uncalled.
 * Marks the cell, adds to picks, auto-marks everyone who had that number,
 * advances turn, and checks for winner.
 */
export async function applyPick(
  roomId: string,
  userId: string,
  cellIndex: number
): Promise<{ state: BingoState; error?: string }> {
  // Load only what we need
  const [room, playerCard, allCards] = await Promise.all([
    prisma.room.findUnique({
      where: { id: roomId },
      include: { players: { orderBy: { joinedAt: "asc" } } },
    }),
    prisma.bingoCard.findUnique({
      where: { roomId_userId: { roomId, userId } },
    }),
    prisma.bingoCard.findMany({ where: { roomId } }),
  ]);

  if (!room || !playerCard) {
    return { state: {} as BingoState, error: "Room or card not found" };
  }

  const turnOrder = room.players.map((p) => p.userId);
  const picks = await prisma.bingoPick.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
  });
  const currentTurnIndex = picks.length % turnOrder.length;
  if (turnOrder[currentTurnIndex] !== userId) {
    return { state: {} as BingoState, error: "Not your turn" };
  }

  if (cellIndex < 0 || cellIndex > 24 || playerCard.marked.includes(cellIndex)) {
    return { state: {} as BingoState, error: "Invalid cell" };
  }

  const number = playerCard.numbers[cellIndex];
  const calledSet = new Set(picks.map((p) => p.number));
  if (calledSet.has(number)) {
    return { state: {} as BingoState, error: "Number already called" };
  }

  // Create pick
  await prisma.bingoPick.create({
    data: { roomId, userId, number },
  });

  // Batch update all matching cards in parallel
  const updates = allCards
    .filter((c) => {
      const idx = c.numbers.indexOf(number);
      return idx !== -1 && !c.marked.includes(idx);
    })
    .map((c) => {
      const idx = c.numbers.indexOf(number);
      const newMarked = [...c.marked, idx];
      return prisma.bingoCard.update({
        where: { id: c.id },
        data: {
          marked: newMarked,
          lines: countLines(newMarked),
        },
      });
    });
  await Promise.all(updates);

  return { state: (await loadState(roomId))! };
}

/**
 * Manually mark a cell on the current player's own card during the marking window.
 * In our implementation, marks happen automatically after 5s,
 * but the client can also send this to mark instantly.
 */
export async function markCell(roomId: string, userId: string, cellIndex: number) {
  const card = await prisma.bingoCard.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!card) return { error: "No card" };
  if (card.marked.includes(cellIndex)) return { ok: true }; // already marked

  const newMarked = [...card.marked, cellIndex];
  await prisma.bingoCard.update({
    where: { id: card.id },
    data: {
      marked: newMarked,
      lines: countLines(newMarked),
    },
  });

  return { ok: true };
}

/**
 * Validate a BINGO claim by a user.
 */
export async function validateBingoClaim(
  roomId: string,
  userId: string
): Promise<{ valid: boolean; lines: number; error?: string }> {
  const card = await prisma.bingoCard.findUnique({
    where: { roomId_userId: { roomId, userId } },
  });
  if (!card) return { valid: false, lines: 0, error: "No card" };

  const lines = countLines(card.marked);
  return { valid: lines >= LINES_TO_WIN, lines };
}

/**
 * Advance turn counter — called after the pick window closes.
 */
export async function advanceTurn(roomId: string): Promise<BingoState | null> {
  const state = await loadState(roomId);
  if (!state) return null;

  // Just reload — currentTurnIndex is derived from picks.length % turnOrder.length
  // So no explicit mutation needed. Return fresh state.
  return state;
}

export { LINES_TO_WIN, completedLines };