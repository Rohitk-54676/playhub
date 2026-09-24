"use client";

import { motion } from "framer-motion";
import { Gamepad2, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-sm font-medium text-accent">Welcome to PlayHub</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Play with friends.
        </h1>
        <p className="text-muted-foreground">
          Create a room, invite friends, and play games together.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl border bg-card p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Gamepad2 className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold">Games coming soon</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bingo is being built. Check back shortly.
        </p>
      </motion.div>
    </div>
  );
}