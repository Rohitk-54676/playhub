"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, LogOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicTacToeBoard } from "@/components/tictactoe/TicTacToeBoard";
import { useSound } from "@/hooks/useSound";
import {
  applyMove,
  checkResult,
  EMPTY_BOARD,
  otherPlayer,
  type Board,
  type Player,
} from "@/lib/tictactoe/logic";
import { cn } from "@/lib/utils";

const X_COLOR = "#a855f7"; // accent purple
const O_COLOR = "#3b82f6"; // blue

export default function OfflineTicTacToePage() {
  const router = useRouter();
  const { play } = useSound();
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [starter, setStarter] = useState<Player>("X"); // who starts next game

  const result = checkResult(board);
  const gameOver = result.winner !== null || result.draw;

  function handlePlay(index: number) {
    if (gameOver) return;
    if (board[index] !== null) return;

    const next = applyMove(board, index, currentPlayer);
    setBoard(next);

    const r = checkResult(next);
    if (r.winner) {
      play("win");
    } else if (!r.draw) {
      play("pick");
      setCurrentPlayer(otherPlayer(currentPlayer));
    } else {
      play("mark");
    }
  }

  function rematch() {
    // Swap starter each rematch
    const nextStarter = otherPlayer(starter);
    setStarter(nextStarter);
    setCurrentPlayer(nextStarter);
    setBoard(EMPTY_BOARD);
  }

  function handleLeave() {
    router.push("/play/tic-tac-toe");
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="h-7 w-7 p-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Offline · 2 players
            </p>
            <h1 className="text-base font-bold leading-tight">Tic Tac Toe</h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={rematch}
          className="h-7 px-2 text-xs"
        >
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Restart
        </Button>
      </div>

      {/* Turn indicator */}
      <div
        className={cn(
          "shrink-0 rounded-lg border px-3 py-1.5 text-center",
          currentPlayer === "X" ? "border-purple-500/30" : "border-blue-500/30"
        )}
        style={{
          backgroundColor:
            currentPlayer === "X" ? `${X_COLOR}15` : `${O_COLOR}15`,
        }}
      >
        <p
          className="text-xs font-medium"
          style={{ color: currentPlayer === "X" ? X_COLOR : O_COLOR }}
        >
          {gameOver ? (
            result.winner ? (
              `🎉 Player ${result.winner} wins!`
            ) : (
              "It's a draw!"
            )
          ) : (
            <>
              🎯 Player <span className="font-bold">{currentPlayer}</span> — your turn
            </>
          )}
        </p>
      </div>

      {/* Board */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <TicTacToeBoard
          board={board}
          currentPlayer={currentPlayer}
          canPlay={!gameOver}
          xColor={X_COLOR}
          oColor={O_COLOR}
          winLine={result.line}
          onPlay={handlePlay}
        />
      </div>

      {/* Footer */}
      {gameOver && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex shrink-0 justify-center gap-2"
        >
          <Button onClick={rematch}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Play Again
          </Button>
          <Button variant="outline" onClick={handleLeave}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Back
          </Button>
        </motion.div>
      )}
    </div>
  );
}