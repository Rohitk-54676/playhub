"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { OpponentSeat } from "./OpponentSeat";
import { UnoCardFace, COLOR_FILLS } from "./UnoCardFace";
import type { UnoGameState } from "@/lib/uno/types";

interface Props {
  state: UnoGameState;
  myPlayerId: string;
  playerInfo: Record<
    string,
    { username: string; display_name: string | null; avatar_url: string | null }
  >;
  hostId: string;
  onDrawPileClick?: () => void;
  onCatchUno?: (targetId: string) => void;
}

export function UnoTable({
  state,
  myPlayerId,
  playerInfo,
  hostId,
  onDrawPileClick,
  onCatchUno,
}: Props) {
  const topCard = state.discardPile[state.discardPile.length - 1];
  const showDrawPile =
    !state.pendingType || state.pendingPlayerId !== myPlayerId;
  const currentPlayerId = state.players[state.currentPlayerIndex].id;

  // Arrange opponents in turn order
  const myIndex = state.players.findIndex((p) => p.id === myPlayerId);
  const others = [
    ...state.players.slice(myIndex + 1),
    ...state.players.slice(0, myIndex),
  ];

  const totalOpponents = others.length;
  const totalPlayers = totalOpponents + 1; // Includes "me"
  const seatAngle = (2 * Math.PI) / totalPlayers;
  const radius = 160;

  // Helper to get X/Y coordinates (in px) from the center
  const getSeatPos = (index: number) => {
    const angle = Math.PI / 2 + index * seatAngle; // Bottom center is starting point
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: radius * 2 + 80, height: radius * 2 + 80 }}
    >
      {/* The Table Surface */}
      <div
        className="absolute rounded-full border-4 border-emerald-900/50 bg-emerald-950/40 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]"
        style={{ width: radius * 2, height: radius * 2 }}
      />

      {/* The Infinitely Rotating Snake Ring */}
      {state.phase === "playing" && !state.pendingType && (
        <motion.div
          className="pointer-events-none absolute z-10 flex items-center justify-center will-change-transform"
          style={{ width: radius * 2, height: radius * 2 }}
          animate={{ rotate: state.direction === 1 ? 360 : -360 }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* The glowing circular track (Static shadow to save GPU) */}
          <div className="absolute inset-0 rounded-full border-4 border-accent/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]" />

          {/* The glowing arrowhead */}
          <div className="absolute -top-5 flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-md">
            {state.direction === 1 ? (
              <ArrowRight className="h-6 w-6" />
            ) : (
              <ArrowLeft className="h-6 w-6" />
            )}
          </div>
        </motion.div>
      )}

      {/* Opponents */}
      {others.map((p, i) => {
        const pos = getSeatPos(i + 1);
        const isFinished = p.hand.length === 0;
        const isCurrent = currentPlayerId === p.id;

        return (
          <div
            key={p.id}
            className={`absolute z-20 transition-all duration-500 ${
              isFinished ? "scale-75 opacity-40 grayscale" : ""
            }`}
            style={{
              left: `calc(50% + ${pos.x}px)`,
              top: `calc(50% + ${pos.y}px)`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <OpponentSeat
              playerId={p.id}
              username={playerInfo[p.id]?.username ?? ""}
              displayName={playerInfo[p.id]?.display_name ?? null}
              avatarUrl={playerInfo[p.id]?.avatar_url ?? null}
              cardCount={p.hand.length}
              isCurrentTurn={isCurrent}
              calledUno={p.calledUno}
              placement={p.placement}
              isHost={p.id === hostId}
              canCatch={p.hand.length === 1 && !p.calledUno && !isFinished}
              onCatchUno={onCatchUno}
            />
          </div>
        );
      })}

      {/* Center Piles */}
      <div className="relative z-30 flex items-center gap-4">
        {/* Draw Pile */}
        {showDrawPile ? (
          <motion.div
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDrawPileClick}
            className={`flex flex-col items-center gap-1 ${
              onDrawPileClick ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <UnoCardFace
              card={{ id: "back", color: "wild", type: "wild" }}
              size="md"
              faceDown
            />
            <span className="text-[10px] font-medium text-white/60">
              Draw ({state.drawPile.length})
            </span>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-1 opacity-40">
            <UnoCardFace
              card={{ id: "back", color: "wild", type: "wild" }}
              size="md"
              faceDown
            />
            <span className="text-[10px] text-white/60">Pending</span>
          </div>
        )}

        {/* Discard Pile */}
        <div className="flex flex-col items-center gap-1.5">
          {topCard && (
            <UnoCardFace
              key={topCard.id}
              card={topCard}
              size="md"
              animateIn
            />
          )}
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-0.5 backdrop-blur">
            <div
              className="h-2.5 w-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: COLOR_FILLS[state.currentColor] }}
            />
            <span className="text-[10px] font-medium capitalize text-white">
              {state.currentColor}
            </span>
          </div>
        </div>
      </div>

      {/* Waiting Text */}
      {currentPlayerId !== myPlayerId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-4 py-1 text-xs font-medium text-white backdrop-blur"
        >
          Waiting for {playerInfo[currentPlayerId]?.display_name ?? "player"}…
        </motion.div>
      )}
    </div>
  );
}