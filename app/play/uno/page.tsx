"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  Plus,
  LogIn,
  Bot,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track, EVENT } from "@/lib/analytics";
import { toast } from "sonner";

export default function UnoHomePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: "uno" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create");
        setCreating(false);
        return;
      }
      track(EVENT.ROOM_CREATED, { gameId: "uno" });
      router.push(`/play/uno/room/${data.code}`);
    } catch {
      toast.error("Network error");
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length !== 6) {
      toast.error("Code must be 6 characters");
      return;
    }
    setJoining(true);
    router.push(`/play/uno/room/${clean}`);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <div className="text-5xl">🎴</div>
        <h1 className="text-3xl font-bold tracking-tight">Uno</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Match colors and numbers. Play action cards. Call UNO. Last one
          holding cards loses.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            2–6 players
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            5–15 min
          </span>
        </div>
      </motion.div>

      {/* vs Computer — coming next batch */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        disabled
        className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed bg-card/40 p-5 text-left opacity-50"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Play vs Computer</p>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </div>
      </motion.button>

      {/* Create + Join */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">Create room</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Start a game and share the code with friends.
          </p>
          <Button
            onClick={handleCreate}
            disabled={creating}
            variant="outline"
            className="w-full"
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
            <h2 className="font-semibold">Join room</h2>
          </div>
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="text-center font-mono text-lg tracking-widest"
            />
            <Button
              type="submit"
              disabled={joining || code.length !== 6}
              variant="outline"
              className="w-full"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Join
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}