"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Clock, Bot } from "lucide-react";
import { GAMES } from "@/lib/games";
import { cn } from "@/lib/utils";

export default function GamesPage() {
  return (
    <div className="flex flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold tracking-tight">Games</h1>
        <p className="text-muted-foreground">
          Pick a game to play with friends or against the computer.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 + i * 0.05 }}
            whileHover={game.available ? { y: -4 } : {}}
          >
            <Link
              href={game.available ? `/play/${game.id}` : "#"}
              className={cn(
                "group flex flex-col gap-4 rounded-2xl border bg-card p-5 transition-shadow",
                game.available
                  ? "cursor-pointer hover:shadow-lg"
                  : "cursor-not-allowed opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl",
                  game.color
                )}
              >
                {game.icon}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{game.name}</h2>
                  {!game.available && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {game.description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {game.minPlayers}–{game.maxPlayers}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {game.avgTime}
                </span>
                {game.available && (
                  <span className="ml-auto flex items-center gap-1 text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    <Bot className="h-3.5 w-3.5" />
                    Play →
                  </span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}