"use client";

import { motion } from "framer-motion";
import type { TypingUser } from "@/hooks/useChat";

interface Props {
  users: TypingUser[];
  currentUserId: string | null;
}

export function TypingIndicator({ users, currentUserId }: Props) {
  const others = users.filter((u) => u.userId !== currentUserId);
  if (others.length === 0) return null;

  const names = others.map((u) => u.username).join(", ");
  const text =
    others.length === 1
      ? `${names} is typing`
      : `${names} are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
      <span>{text}</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1 w-1 rounded-full bg-muted-foreground"
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </span>
    </div>
  );
}