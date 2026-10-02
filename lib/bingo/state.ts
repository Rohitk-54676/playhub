import { prisma } from "@/lib/prisma";
import { generateCard } from "./card";

export interface BingoCardData {
  userId: string;
  numbers: number[];
  marked: number[];
  lines: number;
}

export interface BingoState {
  cards: BingoCardData[];
  picks: { number: number; userId: string; at: string }[];
  turnOrder: string[]; // user ids
  currentTurnIndex: number;
  calledNumbers: number[]; // all numbers that have been picked
  turnStartedAt: string; // ISO
  turnEndsAt: string;    // ISO
  markWindowEndsAt: string | null; // ISO — during marking phase
  winnerId: string | null;
  winningLines: number[][];
  phase: "picking" | "marking" | "finished";
}

const TURN_SECONDS = 15;
const MARK_SECONDS = 5;

/**
 * Initialize bingo state for a room — generates cards for all players.
 */
export async function initBingoGame(roomId: string): Promise<BingoState> {
  const players = await prisma.roomPlayer.findMany({
    where: { roomId },
    orderBy: { joinedAt: "asc" },
  });

  const cards = await Promise.all(
    players.map(async (p) => {
      const numbers = generateCard();
      const card = await prisma.bingoCard.create({
        data: {
          roomId,
          userId: p.userId,
          numbers,
          marked: [],
          lines: 0,
        },
      });
      return {
        userId: p.userId,
        numbers: card.numbers,
        marked: card.marked,
        lines: card.lines,
      };
    })
  );

  const turnOrder = players.map((p) => p.userId);
  const now = new Date();
  const turnEndsAt = new Date(now.getTime() + TURN_SECONDS * 1000);

  return {
    cards,
    picks: [],
    turnOrder,
    currentTurnIndex: 0,
    calledNumbers: [],
    turnStartedAt: now.toISOString(),
    turnEndsAt: turnEndsAt.toISOString(),
    markWindowEndsAt: null,
    winnerId: null,
    winningLines: [],
    phase: "picking",
  };
}

export function turnDurationMs() {
  return TURN_SECONDS * 1000;
}

export function markDurationMs() {
  return MARK_SECONDS * 1000;
}

export { TURN_SECONDS, MARK_SECONDS };