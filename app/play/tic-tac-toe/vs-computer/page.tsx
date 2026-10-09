"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Loader2,
  LogOut,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicTacToeBoard } from "@/components/tictactoe/TicTacToeBoard";
import { useSound } from "@/hooks/useSound";
import { chooseBotMove, type Difficulty } from "@/lib/tictactoe/ai";
import {
  applyMove,
  checkResult,
  EMPTY_BOARD,
  otherPlayer,
  type Board,
  type Player,
} from "@/lib/tictactoe/logic";
import { cn } from "@/lib/utils";

const X_COLOR = "#a855f7";
const O_COLOR = "#3b82f6";

const DIFFICULTIES: {
  id: Difficulty;
  label: string;
  sub: string;
  emoji: string;
}[] = [
  { id: "easy", label: "Easy", sub: "Casual — makes mistakes", emoji: "🙂" },
  { id: "medium", label: "Medium", sub: "Blocks and wins when it can", emoji: "😐" },
  { id: "hard", label: "Hard", sub: "Perfect — cannot be beaten", emoji: "😈" },
];

export default function VsComputerTicTacToePage() {
  const router = useRouter();
  const { play } = useSound();
  const [board, setBoard] = useState<Board>(EMPTY_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [playerIsX, setPlayerIsX] = useState(true); // human plays X by default
  const [thinking, setThinking] = useState(false);
  const prevBoardRef = useRef<Board>(board);

  const mySymbol: Player = playerIsX ? "X" : "O";
  const botSymbol: Player = otherPlayer(mySymbol);

  const result = checkResult(board);
  const gameOver = result.winner !== null || result.draw;
  const isMyTurn = currentPlayer === mySymbol && !gameOver;

  // Bot auto-move
  useEffect(() => {
    if (!difficulty) return;
    if (gameOver) return;
    if (currentPlayer !== botSymbol) return;

    setThinking(true);
    const delay = 500 + Math.random() * 400;
    const t = setTimeout(() => {
      const move = chooseBotMove(board, botSymbol, difficulty);
      if (move !== null) {
        const next = applyMove(board, move, botSymbol);
        setBoard(next);
        const r = checkResult(next);
        if (r.winner) play("win");
        else if (r.draw) play("mark");
        else {
          play("pick");
          setCurrentPlayer(mySymbol);
        }
      }
      setThinking(false);
    }, delay);

    return () => clearTimeout(t);
  }, [board, currentPlayer, botSymbol, mySymbol, difficulty, gameOver, play]);

  function handlePlay(index: number) {
    if (!isMyTurn) return;
    if (board[index] !== null) return;

    const next = applyMove(board, index, mySymbol);
    setBoard(next);

    const r = checkResult(next);
    if (r.winner) {
      play("win");
    } else if (!r.draw) {
      play("pick");
      setCurrentPlayer(botSymbol);
    } else {
      play("mark");
    }
  }

  function startGame(diff: Difficulty) {
    setDifficulty(diff);
    setBoard(EMPTY_BOARD);
    setCurrentPlayer("X");
    setPlayerIsX(true);
    prevBoardRef.current = EMPTY_BOARD;
  }

  function rematch() {
    // Swap symbols
    const nextPlayerIsX = !playerIsX;
    setPlayerIsX(nextPlayerIsX);
    setBoard(EMPTY_BOARD);
    setCurrentPlayer("X"); // X always goes first
  }

  function changeDifficulty() {
    setDifficulty(null);
    setBoard(EMPTY_BOARD);
    setCurrentPlayer("X");
    setThinking(false);
  }

  function handleLeave() {
    router.push("/play/tic-tac-toe");
  }

  // Difficulty picker
  if (!difficulty) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-3"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeave}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Play vs Computer
            </h1>
            <p className="text-xs text-muted-foreground">
              Pick your difficulty
            </p>
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          {DIFFICULTIES.map((d, i) => (
            <motion.button
              key={d.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 + i * 0.05 }}
              onClick={() => startGame(d.id)}
              className="flex items-center gap-4 rounded-2xl border bg-card p-5 text-left transition-all hover:border-accent hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-2xl">
                {d.emoji}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{d.label}</p>
                <p className="text-xs text-muted-foreground">{d.sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  const diffLabel = DIFFICULTIES.find((d) => d.id === difficulty)?.label ?? "";

  return (
    <div className="flex h-full flex-col gap-3">
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
              vs Computer · {diffLabel}
            </p>
            <h1 className="text-base font-bold leading-tight">Tic Tac Toe</h1>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={changeDifficulty}
            className="h-7 px-2 text-xs"
          >
            <Smartphone className="mr-1 h-3.5 w-3.5" />
            Difficulty
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "shrink-0 rounded-lg border px-3 py-1.5 text-center",
          gameOver
            ? "border-border bg-card"
            : isMyTurn
            ? "border-accent bg-accent/10"
            : "border-blue-500/30 bg-blue-500/10"
        )}
      >
        <p
          className={cn(
            "flex items-center justify-center gap-1.5 text-xs font-medium",
            gameOver
              ? ""
              : isMyTurn
              ? "text-accent"
              : "text-blue-500"
          )}
        >
          {gameOver ? (
            result.winner ? (
              result.winner === mySymbol ? (
                <>🏆 You won!</>
              ) : (
                <>🤖 Computer won!</>
              )
            ) : (
              <>It's a draw!</>
            )
          ) : isMyTurn ? (
            <>🎯 Your turn — you're {mySymbol}</>
          ) : (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Computer is thinking…
            </>
          )}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <TicTacToeBoard
          board={board}
          currentPlayer={currentPlayer}
          canPlay={isMyTurn}
          xColor={X_COLOR}
          oColor={O_COLOR}
          winLine={result.line}
          onPlay={handlePlay}
        />
      </div>

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