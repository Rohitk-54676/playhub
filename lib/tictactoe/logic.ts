export type Cell = "X" | "O" | null;
export type Board = Cell[]; // length 9, index 0..8 (row-major)
export type Player = "X" | "O";

export const EMPTY_BOARD: Board = Array(9).fill(null);

export const WIN_LINES: number[][] = [
  // rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // diagonals
  [0, 4, 8],
  [2, 4, 6],
];

export interface GameResult {
  winner: Player | null;
  line: number[] | null; // winning line indices if winner
  draw: boolean;
}

export function checkResult(board: Board): GameResult {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line, draw: false };
    }
  }
  const full = board.every((c) => c !== null);
  return { winner: null, line: null, draw: full };
}

export function isBoardFull(board: Board): boolean {
  return board.every((c) => c !== null);
}

export function legalMoves(board: Board): number[] {
  const moves: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) moves.push(i);
  }
  return moves;
}

export function applyMove(board: Board, index: number, player: Player): Board {
  if (index < 0 || index > 8) return board;
  if (board[index] !== null) return board;
  const next = [...board];
  next[index] = player;
  return next;
}

export function otherPlayer(p: Player): Player {
  return p === "X" ? "O" : "X";
}