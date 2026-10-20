"use client";

import { AnimatePresence, motion } from "framer-motion";

export interface LogEntry {
  id: string;
  text: string;
  at: string;
}

interface Props {
  entries: LogEntry[];
}

export function ActionLog({ entries }: Props) {
  return (
    // Hidden on mobile (md:block), or make it compact
    <div className="hidden max-h-40 w-40 flex-col gap-1 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-2 backdrop-blur-md md:flex">
      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/40">
        Activity
      </p>
      <AnimatePresence initial={false}>
        {entries.slice(0, 8).map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            className="text-[10px] leading-tight text-white/70"
          >
            {e.text}
          </motion.div>
        ))}
      </AnimatePresence>
      {entries.length === 0 && (
        <p className="text-[10px] text-white/40">No activity</p>
      )}
    </div>
  );
}