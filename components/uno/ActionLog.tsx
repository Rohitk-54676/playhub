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
    <div className="flex max-h-48 w-44 flex-col gap-1 overflow-y-auto rounded-xl border bg-card/60 p-2 backdrop-blur-sm">
      <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        Activity
      </p>
      <AnimatePresence initial={false}>
        {entries.slice(0, 10).map((e) => (
          <motion.div
            key={e.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            className="text-[10px] leading-tight text-muted-foreground"
          >
            {e.text}
          </motion.div>
        ))}
      </AnimatePresence>
      {entries.length === 0 && (
        <p className="text-[10px] text-muted-foreground">No activity</p>
      )}
    </div>
  );
}