import { prisma } from "@/lib/prisma";
import {
  applyMove,
  checkResult,
  EMPTY_BOARD,
  otherPlayer,
  type Board,
  type Player,
} from "./logic";

export interface TicTacToeState {
  board: Board;
  currentPlayer: Player;
  xUserId: string; // who plays X
  oUserId: string; // who plays O
  winner: Player | null;
  winningLine: number[] | null;
  draw: boolean;
  finished: boolean;
}

/**
 * Initialize a TTT game for a room. Uses existing players (must be 2).
 */
export async function startTicTacToeGame(
  roomId: string
): Promise<TicTacToeState> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      players: { orderBy: { joinedAt: "asc" } },
    },
  });
  if (!room) throw new Error("Room not found");
  if (room.players.length < 2) throw new Error("Need 2 players");

  const [first, second] = room.players;
  const state: TicTacToeState = {
    board: EMPTY_BOARD,
    currentPlayer: "X",
    xUserId: first.userId,
    oUserId: second.userId,
    winner: null,
    winningLine: null,
    draw: false,
    finished: false,
  };

  await prisma.room.update({
    where: { id: roomId },
    data: { status: "playing", state: state as object },
  });

  return state;
}

export async function loadTicTacToeState(
  roomId: string
): Promise<TicTacToeState | null> {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || !room.state) return null;
  return room.state as unknown as TicTacToeState;
}

/**
 * Apply a move by a user.
 */
export async function applyTicTacToeMove(
  roomId: string,
  userId: string,
  cellIndex: number
): Promise<{ state: TicTacToeState; error?: string }> {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || !room.state) {
    return { state: {} as TicTacToeState, error: "Game not found" };
  }

  const state = room.state as unknown as TicTacToeState;

  if (state.finished) {
    return { state, error: "Game already finished" };
  }

  // Whose turn is it?
  const currentUserId =
    state.currentPlayer === "X" ? state.xUserId : state.oUserId;
  if (currentUserId !== userId) {
    return { state, error: "Not your turn" };
  }

  if (cellIndex < 0 || cellIndex > 8) {
    return { state, error: "Invalid cell" };
  }
  if (state.board[cellIndex] !== null) {
    return { state, error: "Cell already taken" };
  }

  const next = applyMove(state.board, cellIndex, state.currentPlayer);
  const result = checkResult(next);

  const newState: TicTacToeState = {
    ...state,
    board: next,
    winner: result.winner,
    winningLine: result.line,
    draw: result.draw,
    finished: result.winner !== null || result.draw,
    currentPlayer: result.winner || result.draw
      ? state.currentPlayer
      : otherPlayer(state.currentPlayer),
  };

  await prisma.room.update({
    where: { id: roomId },
    data: {
      state: newState as object,
      status: newState.finished ? "finished" : "playing",
    },
  });

  return { state: newState };
}

/** Restart — X and O swap. */
export async function restartTicTacToeGame(
  roomId: string
): Promise<TicTacToeState> {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || !room.state) throw new Error("Game not found");

  const old = room.state as unknown as TicTacToeState;
  const newState: TicTacToeState = {
    board: EMPTY_BOARD,
    currentPlayer: "X",
    xUserId: old.oUserId, // swap
    oUserId: old.xUserId,
    winner: null,
    winningLine: null,
    draw: false,
    finished: false,
  };

  await prisma.room.update({
    where: { id: roomId },
    data: { status: "playing", state: newState as object },
  });

  return newState;
}