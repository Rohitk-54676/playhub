"use client";

import { motion } from "framer-motion";
import { Crown, Flag } from "lucide-react";
import { UserAvatar } from "@/components/social/UserAvatar";
import { UnoCardBack } from "./UnoCardBack";
import { cn } from "@/lib/utils";

interface Props {
  playerId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  cardCount: number;
  isCurrentTurn: boolean;
  calledUno: boolean;
  placement: number | null;
  isHost?: boolean;
  canCatch?: boolean;
  onCatchUno?: (targetId: string) => void;
}

export function OpponentSeat({
  playerId,
  username,
  displayName,
  avatarUrl,
  cardCount,
  isCurrentTurn,
  calledUno,
  placement,
  isHost,
  canCatch = false,
  onCatchUno,
}: Props) {
  const name = displayName ?? username;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-2xl border bg-card/80 p-2 backdrop-blur-sm",
        isCurrentTurn && "border-accent shadow-[0_0_20px_rgba(168,85,247,0.4)]"
      )}
    >
      <div className="relative">
        <UserAvatar
          username={username}
          displayName={displayName}
          avatarUrl={avatarUrl}
          size="md"
        />
        {isHost && (
          <Crown className="absolute -right-1 -top-1 h-4 w-4 text-amber-400" />
        )}
        {placement !== null && (
          <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[9px] font-bold text-white">
            {placement}
          </div>
        )}
      </div>

      <div className="max-w-20 truncate text-center text-[10px] font-medium">
        {name}
      </div>

      {/* Card count with mini card backs */}
      <div className="flex items-center gap-0.5">
        {placement === null ? (
          <>
            {cardCount <= 5 ? (
              <div className="flex gap-0.5">
                {Array.from({ length: cardCount }).map((_, i) => (
                  <UnoCardBack key={i} size={10} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-0.5">
                <div className="flex">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                      <UnoCardBack size={10} />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground">
                  ×{cardCount}
                </span>
              </div>
            )}
          </>
        ) : (
          <Flag className="h-3 w-3 text-green-500" />
        )}
      </div>

      {calledUno && cardCount === 1 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white"
        >
          UNO
        </motion.span>
      )}

      {/* Catch button — appears when player has 1 card and didn't call UNO */}
      {canCatch && onCatchUno && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onCatchUno(playerId)}
          className="mt-0.5 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-md hover:bg-red-600"
        >
          Catch!
        </motion.button>
      )}

      {isCurrentTurn && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-[9px] font-medium text-accent"
        >
          playing…
        </motion.div>
      )}
    </motion.div>
  );
}