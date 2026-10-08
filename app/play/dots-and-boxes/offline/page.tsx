"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useOfflineDots } from "@/hooks/useOfflineDots";
import { cn } from "@/lib/utils";
import { OFFLINE_COLORS, OFFLINE_LETTERS } from "@/lib/dots/offline";

const PLAYER_OPTIONS = [2, 3, 4];
const SIZE_OPTIONS = [
  { value: 4, label: "4×4", sub: "9 boxes" },
  { value: 5, label: "5×5", sub: "16 boxes" },
  { value: 6, label: "6×6", sub: "25 boxes" },
  { value: 7, label: "7×7", sub: "36 boxes" },
  { value: 8, label: "8×8", sub: "49 boxes" },
];

export default function OfflineSetupPage() {
  const router = useRouter();
  const { start } = useOfflineDots();
  const [players, setPlayers] = useState(2);
  const [size, setSize] = useState(5);

  function handleStart() {
    start(players, size);
    router.push("/play/dots-and-boxes/offline/game");
  }

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
          onClick={() => router.push("/play/dots-and-boxes")}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Play Offline</h1>
          <p className="text-xs text-muted-foreground">
            Pass the phone — no waiting, no network
          </p>
        </div>
      </motion.div>

      {/* Players */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <Label>How many players?</Label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PLAYER_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => setPlayers(n)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                players === n
                  ? "border-accent bg-accent/10 text-accent"
                  : "hover:border-accent/50"
              )}
            >
              <div className="flex gap-1">
                {Array.from({ length: n }).map((_, i) => (
                  <span
                    key={i}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: OFFLINE_COLORS[i] }}
                  >
                    {OFFLINE_LETTERS[i]}
                  </span>
                ))}
              </div>
              <span className="text-xs font-medium">{n} players</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Grid size */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
      >
        <Label>Board size</Label>
        <div className="grid grid-cols-5 gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSize(s.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border p-2 transition-all",
                size === s.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "hover:border-accent/50"
              )}
            >
              <span className="text-sm font-bold">{s.label}</span>
              <span className="text-[9px] text-muted-foreground">
                {s.sub}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Start */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
      >
        <Button onClick={handleStart} size="lg" className="w-full">
          <Play className="mr-2 h-4 w-4" />
          Start Game
        </Button>
      </motion.div>
    </div>
  );
}