"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gamepad2,
  MessageCircle,
  Users,
  ChevronRight,
  Sparkles,
  Trophy,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useFriends } from "@/hooks/useFriends";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { GAMES } from "@/lib/games";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { profile } = useProfile();
  const { friends } = useFriends();
  const { unread } = useUnreadMessages();

  const greeting = profile
    ? `Hey, ${profile.display_name ?? profile.username} 👋`
    : "Welcome to PlayHub";

  const availableGames = GAMES.filter((g) => g.available);

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-sm font-medium text-accent">
            Welcome to PlayHub
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {greeting}
        </h1>
        <p className="text-muted-foreground">
          Play games, chat with friends, and hang out.
        </p>
      </motion.div>

      {/* Quick play */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quick play</h2>
          <Link
            href="/games"
            className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            All games
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {availableGames.slice(0, 4).map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.05 }}
              whileHover={{ y: -3 }}
            >
              <Link
                href={`/play/${game.id}`}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-lg"
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-2xl",
                    game.color
                  )}
                >
                  {game.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{game.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {game.minPlayers}–{game.maxPlayers} players · {game.avgTime}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Link
            href="/friends"
            className="flex flex-col gap-2 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center gap-2 text-accent">
              <Users className="h-5 w-5" />
              <span className="text-2xl font-bold text-foreground">
                {friends.length}
              </span>
            </div>
            <p className="text-sm font-medium">Friends</p>
            <p className="text-xs text-muted-foreground">
              {friends.length === 0
                ? "Add friends to play together"
                : "Ready to hang out"}
            </p>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Link
            href="/messages"
            className="flex flex-col gap-2 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center gap-2 text-accent">
              <MessageCircle className="h-5 w-5" />
              <span className="text-2xl font-bold text-foreground">
                {unread}
              </span>
            </div>
            <p className="text-sm font-medium">Unread messages</p>
            <p className="text-xs text-muted-foreground">
              {unread === 0 ? "All caught up" : "You have new messages"}
            </p>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Link
            href="/play/bingo"
            className="flex flex-col gap-2 rounded-2xl border bg-card p-5 transition-shadow hover:shadow-lg"
          >
            <div className="flex items-center gap-2 text-accent">
              <Trophy className="h-5 w-5" />
              <span className="text-2xl font-bold text-foreground">
                {availableGames.length}
              </span>
            </div>
            <p className="text-sm font-medium">Games available</p>
            <p className="text-xs text-muted-foreground">
              More coming soon
            </p>
          </Link>
        </motion.div>
      </section>

      {/* Play vs Computer CTA */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Link
          href="/play/bingo"
          className="group flex items-center justify-between gap-4 rounded-2xl border-2 border-accent bg-accent/5 p-5 transition-all hover:bg-accent/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-fg">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Play vs Computer</p>
              <p className="text-xs text-muted-foreground">
                Jump right in — no waiting
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-accent transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.section>
    </div>
  );
}