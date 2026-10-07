"use client";

import { track, EVENT } from "@/lib/analytics";
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
import { cn } from "@/lib/utils";

const DOTS_SIZES = [
  { value: 4, label: "4×4", sub: "9 boxes" },
  { value: 5, label: "5×5", sub: "16 boxes" },
  { value: 6, label: "6×6", sub: "25 boxes" },
  { value: 7, label: "7×7", sub: "36 boxes" },
  { value: 8, label: "8×8", sub: "49 boxes" },
];

export default function GamePlayPage() {
  const router = useRouter();
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const game = getGame(gameId);

  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");
  const [dotsSize, setDotsSize] = useState(5);

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
        body: JSON.stringify({ gameId: game.id, size: dotsSize }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create room");
        setCreating(false);
        return;
      }
      router.push(`/play/${game.id}/room/${data.code}`);
      track(EVENT.ROOM_CREATED, { gameId: game.id });
    } catch {
      toast.error("Network error");
      setCreating(false);
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

  const isDots = game.id === "dots-and-boxes";

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

      {/* Grid size picker for dots */}
      {isDots && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
        >
          <Label>Board size</Label>
          <div className="grid grid-cols-5 gap-2">
            {DOTS_SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => setDotsSize(s.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-3 transition-all",
                  dotsSize === s.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "hover:border-accent/50"
                )}
              >
                <span className="text-lg font-bold">{s.label}</span>
                <span className="text-[10px] text-muted-foreground">
                  {s.sub}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

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