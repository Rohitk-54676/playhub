"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  number: number;
  marked: boolean;
  highlighted?: boolean;
  clickable: boolean;
  onMark?: () => void;
}

export function BingoCell({
  number,
  marked,
  highlighted,
  clickable,
  onMark,
}: Props) {
  return (
    <motion.button
      type="button"
      onClick={clickable ? onMark : undefined}
      whileTap={clickable ? { scale: 0.92 } : undefined}
      disabled={!clickable}
      className={cn(
        "flex aspect-square w-full items-center justify-center rounded border text-xs font-semibold transition-colors",
        marked
          ? highlighted
            ? "border-green-500 bg-green-500 text-white"
            : "border-accent bg-accent text-accent-fg"
          : "border-border bg-card text-foreground",
        clickable &&
          !marked &&
          "cursor-pointer hover:border-accent hover:bg-accent/10",
        !clickable && "cursor-default"
      )}
    >
      {number}
    </motion.button>
  );
}