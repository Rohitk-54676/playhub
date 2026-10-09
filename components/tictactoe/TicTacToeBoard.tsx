"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Board, Player } from "@/lib/tictactoe/logic";
import { WIN_LINES } from "@/lib/tictactoe/logic";

interface Props {
  board: Board;
  currentPlayer: Player;
  canPlay: boolean;
  xColor: string;
  oColor: string;
  winLine?: number[] | null;
  onPlay: (index: number) => void;
}

export function TicTacToeBoard({
  board,
  currentPlayer,
  canPlay,
  xColor,
  oColor,
  winLine,
  onPlay,
}: Props) {
  // Build set of winning-cell indices for highlight
  const winSet = new Set(winLine ?? []);

  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => {
          const isWinner = winSet.has(i);
          const canClick = canPlay && cell === null;

          return (
            <motion.button
              key={i}
              type="button"
              onClick={canClick ? () => onPlay(i) : undefined}
              disabled={!canClick}
              whileTap={canClick ? { scale: 0.95 } : undefined}
              className={cn(
                "flex aspect-square items-center justify-center rounded-2xl border-2 text-5xl font-bold transition-all sm:text-6xl",
                isWinner
                  ? "border-green-500 bg-green-500/15"
                  : "border-border bg-card",
                canClick && "hover:border-accent hover:bg-accent/5",
                !canClick && "cursor-default"
              )}
              style={{
                color:
                  cell === "X"
                    ? xColor
                    : cell === "O"
                    ? oColor
                    : undefined,
              }}
            >
              {cell === "X" && (
                <motion.span
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  ✕
                </motion.span>
              )}
              {cell === "O" && (
                <motion.span
                  initial={{ scale: 0, rotate: 45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  ◯
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export { WIN_LINES };