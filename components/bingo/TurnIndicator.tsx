"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Props {
  isYourTurn: boolean;
  currentPlayerName: string;
  phase: "picking" | "marking" | "finished";
  turnSeconds?: number;
}

export function TurnIndicator({
  isYourTurn,
  currentPlayerName,
  phase,
  turnSeconds = 15,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(turnSeconds);

  // Reset timer whenever the player changes
  useEffect(() => {
    setSecondsLeft(turnSeconds);
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setSecondsLeft(Math.max(0, turnSeconds - elapsed));
    }, 250);
    return () => clearInterval(interval);
  }, [turnSeconds, isYourTurn, currentPlayerName]);

  if (phase === "finished") {
    return (
      <div className="shrink-0 rounded-lg border bg-card px-3 py-1.5 text-center">
        <p className="text-xs font-medium">Game finished</p>
      </div>
    );
  }

  return (
    <motion.div
      key={`${currentPlayerName}-${isYourTurn}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`shrink-0 rounded-lg border px-3 py-1.5 text-center ${
        isYourTurn ? "border-accent bg-accent/10" : "bg-card"
      }`}
    >
      <p className={`text-xs font-medium ${isYourTurn ? "text-accent" : ""}`}>
        {isYourTurn
          ? `🎯 Your turn — pick a cell`
          : `${currentPlayerName}'s turn`}
      </p>
      <p className="text-[10px] text-muted-foreground">{secondsLeft}s</p>
    </motion.div>
  );
}