import {
  applyMove,
  checkResult,
  legalMoves,
  otherPlayer,
  type Board,
  type Player,
} from "./logic";

export type Difficulty = "easy" | "medium" | "hard";

function randomMove(board: Board): number | null {
  const moves = legalMoves(board);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

/** Find a move that immediately wins for `player`, if any. */
function findWinningMove(board: Board, player: Player): number | null {
  for (const move of legalMoves(board)) {
    const test = applyMove(board, move, player);
    const { winner } = checkResult(test);
    if (winner === player) return move;
  }
  return null;
}

/**
 * Easy: mostly random, but takes an obvious win if available.
 * Gives beginners a chance.
 */
export function chooseEasyMove(board: Board, me: Player): number | null {
  const win = findWinningMove(board, me);
  if (win !== null) return win;
  return randomMove(board);
}

/**
 * Medium: win if possible, block if opponent can win, else prefer center/corner.
 */
export function chooseMediumMove(board: Board, me: Player): number | null {
  const opponent = otherPlayer(me);

  // 1. Win
  const win = findWinningMove(board, me);
  if (win !== null) return win;

  // 2. Block
  const block = findWinningMove(board, opponent);
  if (block !== null) return block;

  // 3. Prefer center
  if (board[4] === null) return 4;

  // 4. Prefer corners
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5. Any remaining
  return randomMove(board);
}

/**
 * Hard: unbeatable minimax.
 * Returns { move, score } where score = +10 (win) - 10 (loss) 0 (draw), adjusted for depth.
 */
function minimax(
  board: Board,
  me: Player,
  currentPlayer: Player,
  depth: number
): { move: number | null; score: number } {
  const { winner, draw } = checkResult(board);

  if (winner === me) return { move: null, score: 10 - depth };
  if (winner && winner !== me) return { move: null, score: depth - 10 };
  if (draw) return { move: null, score: 0 };

  const moves = legalMoves(board);
  let bestMove: number | null = null;
  let bestScore = currentPlayer === me ? -Infinity : Infinity;

  for (const move of moves) {
    const next = applyMove(board, move, currentPlayer);
    const { score } = minimax(next, me, otherPlayer(currentPlayer), depth + 1);

    if (currentPlayer === me) {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return { move: bestMove, score: bestScore };
}

/**
 * Hard: always optimal. Add slight randomness among equally optimal moves
 * so the AI doesn't feel robotic.
 */
export function chooseHardMove(board: Board, me: Player): number | null {
  const moves = legalMoves(board);
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const move of moves) {
    const next = applyMove(board, move, me);
    const { score } = minimax(next, me, otherPlayer(me), 1);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

/** Unified entry point. */
export function chooseBotMove(
  board: Board,
  me: Player,
  difficulty: Difficulty
): number | null {
  if (difficulty === "easy") return chooseEasyMove(board, me);
  if (difficulty === "medium") return chooseMediumMove(board, me);
  return chooseHardMove(board, me);
}