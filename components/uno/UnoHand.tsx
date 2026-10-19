"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UnoCardFace, COLOR_FILLS } from "./UnoCardFace";
import { canPlayCard, topCard } from "@/lib/uno/rules";
import type { UnoGameState, UnoColor, UnoCard } from "@/lib/uno/types";
import { cn } from "@/lib/utils";

interface Props {
  state: UnoGameState;
  myPlayerId: string;
  canPlay: boolean;
  onPlayCard: (cardId: string, chosenColor?: UnoColor) => void;
}

const COLORS: { id: UnoColor; label: string }[] = [
  { id: "red", label: "Red" },
  { id: "yellow", label: "Yellow" },
  { id: "green", label: "Green" },
  { id: "blue", label: "Blue" },
];

export function UnoHand({ state, myPlayerId, canPlay, onPlayCard }: Props) {
  const [wildPicker, setWildPicker] = useState<UnoCard | null>(null);

  const me = state.players.find((p) => p.id === myPlayerId);
  if (!me) return null;

  const top = topCard(state);
  const isMyTurn = state.players[state.currentPlayerIndex].id === myPlayerId;

  function handleCardClick(card: UnoCard) {
    if (card.type === "wild" || card.type === "wild_draw_four") {
      setWildPicker(card);
    } else {
      onPlayCard(card.id);
    }
  }

  function handleColorChosen(color: UnoColor) {
    if (wildPicker) {
      onPlayCard(wildPicker.id, color);
      setWildPicker(null);
    }
  }

  return (
    <div className="w-full">
      {/* Turn status bar */}
      <div
        className={cn(
          "mx-auto mb-1 max-w-sm rounded-full border px-3 py-0.5 text-center text-[10px] font-medium",
          isMyTurn
            ? "border-accent bg-accent/10 text-accent"
            : "border-border bg-card/60 text-muted-foreground backdrop-blur"
        )}
      >
        {isMyTurn ? "🎯 Your turn — tap a glowing card" : "Waiting…"}
      </div>

      {/* Cards */}
      <div className="w-full overflow-x-auto pb-1">
        <div className="flex min-w-full items-end justify-center gap-1.5 px-3 py-1">
          {me.hand.map((card, i) => {
            const playable =
              canPlay &&
              isMyTurn &&
              canPlayCard(card, top, state.currentColor, me.hand);
            const dimmed = canPlay && isMyTurn && !playable;

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 24,
                  delay: i * 0.02,
                }}
                style={{ zIndex: i }}
                className="relative"
              >
                <UnoCardFace
                  card={card}
                  size="md"
                  highlighted={playable}
                  dimmed={dimmed}
                  onClick={playable ? () => handleCardClick(card) : undefined}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Wild color picker modal */}
      <AnimatePresence>
        {wildPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setWildPicker(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-semibold">Choose a color</p>
              <div className="grid grid-cols-2 gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleColorChosen(c.id)}
                    className="flex h-20 w-20 items-center justify-center rounded-2xl text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: COLOR_FILLS[c.id] }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setWildPicker(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}