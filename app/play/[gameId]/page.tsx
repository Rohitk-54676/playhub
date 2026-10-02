"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  Plus,
  LogIn,
  Sparkles,
  Users,
  Clock,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGame } from "@/lib/games";
import { toast } from "sonner";

export default function GamePlayPage() {
  const router = useRouter();
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const game = getGame(gameId);

  const [creating, setCreating] = useState(false);
  const [soloing, setSoloing] = useState(false);
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!game) router.replace("/");
  }, [game, router]);

  if (!game) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function handleCreate() {
    if (!game) return;
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create room");
        setCreating(false);
        return;
      }
      router.push(`/play/${game.id}/room/${data.code}`);
    } catch {
      toast.error("Network error");
      setCreating(false);
    }
  }

  async function handleSolo() {
    if (!game) return;
    setSoloing(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id, solo: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to start");
        setSoloing(false);
        return;
      }
      router.push(`/play/${game.id}/room/${data.code}`);
    } catch {
      toast.error("Network error");
      setSoloing(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!game) return;
    const clean = code.trim().toUpperCase();
    if (clean.length !== 6) {
      toast.error("Code must be 6 characters");
      return;
    }
    setJoining(true);
    router.push(`/play/${game.id}/room/${clean}`);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <div className="text-5xl">{game.icon}</div>
        <h1 className="text-3xl font-bold tracking-tight">{game.name}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {game.description}
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {game.minPlayers}–{game.maxPlayers} players
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {game.avgTime}
          </span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        onClick={handleSolo}
        disabled={soloing}
        className="flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-accent bg-accent/5 p-5 text-left transition-all hover:bg-accent/10 disabled:opacity-60"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-fg">
            {soloing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Bot className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="font-semibold">Play vs Computer</p>
            <p className="text-xs text-muted-foreground">
              Jump right in against a bot — no waiting
            </p>
          </div>
        </div>
        <Sparkles className="h-5 w-5 text-accent" />
      </motion.button>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Create a room</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Start a game and share the 6-letter code with friends.
          </p>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full"
            variant="outline"
          >
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Room
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
        >
          <div className="flex items-center gap-2">
            <LogIn className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Join a room</h2>
          </div>
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code" className="sr-only">
                Room code
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                className="text-center font-mono text-lg tracking-widest"
              />
            </div>
            <Button
              type="submit"
              disabled={joining || code.length !== 6}
              variant="outline"
              className="w-full"
            >
              {joining ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Join Room
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}