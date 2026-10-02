"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  numbers: number[];
}

export function CalledNumbers({ numbers }: Props) {
  if (numbers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-card/50 px-3 py-1.5 text-center text-[10px] text-muted-foreground">
        No numbers called yet
      </div>
    );
  }

  const reversed = [...numbers].reverse();

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5">
      <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
        Called
      </span>
      <div className="flex flex-1 gap-1 overflow-x-auto">
        <AnimatePresence initial={false}>
          {reversed.slice(0, 40).map((n, i) => (
            <motion.span
              key={`${n}-${i}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded bg-accent px-1.5 text-[10px] font-bold text-accent-fg"
            >
              {n}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}