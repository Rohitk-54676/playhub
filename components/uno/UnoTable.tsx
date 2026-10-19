"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

  // Get opponents in turn order starting from next player
  const myIndex = state.players.findIndex((p) => p.id === myPlayerId);
  const others = [
    ...state.players.slice(myIndex + 1),
    ...state.players.slice(0, myIndex),
  ];

  // Distribute opponents across top row + two side columns
  const topRow = others.filter((_, i) => i % 3 === 0);
  const leftCol = others.filter((_, i) => i % 3 === 1);
  const rightCol = others.filter((_, i) => i % 3 === 2);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between gap-2 py-2">
      {/* Direction indicator */}
      <div className="flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-[10px] text-muted-foreground backdrop-blur">
        {state.direction === 1 ? (
          <>
            <ArrowRight className="h-3 w-3 text-accent" />
            <span>Clockwise</span>
          </>
        ) : (
          <>
            <ArrowLeft className="h-3 w-3 text-accent" />
            <span>Counter-clockwise</span>
          </>
        )}
      </div>

      {/* Top row */}
      <div className="flex flex-wrap items-start justify-center gap-2">
        {topRow.map((p) => (
          <OpponentSeat
            key={p.id}
            playerId={p.id}
            username={playerInfo[p.id]?.username ?? ""}
            displayName={playerInfo[p.id]?.display_name ?? null}
            avatarUrl={playerInfo[p.id]?.avatar_url ?? null}
            cardCount={p.hand.length}
            isCurrentTurn={currentPlayerId === p.id}
            calledUno={p.calledUno}
            placement={p.placement}
            isHost={p.id === hostId}
            canCatch={p.hand.length === 1 && !p.calledUno && !p.finished}
            onCatchUno={onCatchUno}
          />
        ))}
      </div>

      {/* Middle: left column | center pile | right column */}
      <div className="grid w-full flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2 px-2">
        {/* Left column */}
        <div className="flex flex-col items-center gap-2">
          {leftCol.map((p) => (
            <OpponentSeat
              key={p.id}
              playerId={p.id}
              username={playerInfo[p.id]?.username ?? ""}
              displayName={playerInfo[p.id]?.display_name ?? null}
              avatarUrl={playerInfo[p.id]?.avatar_url ?? null}
              cardCount={p.hand.length}
              isCurrentTurn={currentPlayerId === p.id}
              calledUno={p.calledUno}
              placement={p.placement}
              isHost={p.id === hostId}
              canCatch={p.hand.length === 1 && !p.calledUno && !p.finished}
              onCatchUno={onCatchUno}
            />
          ))}
        </div>

        {/* Center: draw + discard */}
        <div className="flex items-center gap-4">
          {/* Draw pile */}
          {showDrawPile ? (
            <motion.div
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDrawPileClick}
              className={`flex flex-col items-center gap-1 ${
                onDrawPileClick ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <UnoCardFace
                card={{ id: "back", color: "wild", type: "wild" }}
                size="lg"
                faceDown
              />
              <span className="text-[10px] text-muted-foreground">
                Draw ({state.drawPile.length})
              </span>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-40">
              <UnoCardFace
                card={{ id: "back", color: "wild", type: "wild" }}
                size="lg"
                faceDown
              />
              <span className="text-[10px] text-muted-foreground">Pending</span>
            </div>
          )}

          {/* Discard pile — uses animateIn for fly-in effect */}
          <div className="flex flex-col items-center gap-1.5">
            {topCard && (
              <UnoCardFace
                key={topCard.id}
                card={topCard}
                size="lg"
                animateIn
              />
            )}
            <div className="flex items-center gap-1.5 rounded-full border bg-card/60 px-2 py-0.5 backdrop-blur">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: COLOR_FILLS[state.currentColor] }}
              />
              <span className="text-[10px] font-medium capitalize">
                {state.currentColor}
              </span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col items-center gap-2">
          {rightCol.map((p) => (
            <OpponentSeat
              key={p.id}
              playerId={p.id}
              username={playerInfo[p.id]?.username ?? ""}
              displayName={playerInfo[p.id]?.display_name ?? null}
              avatarUrl={playerInfo[p.id]?.avatar_url ?? null}
              cardCount={p.hand.length}
              isCurrentTurn={currentPlayerId === p.id}
              calledUno={p.calledUno}
              placement={p.placement}
              isHost={p.id === hostId}
              canCatch={p.hand.length === 1 && !p.calledUno && !p.finished}
              onCatchUno={onCatchUno}
            />
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="h-1" />
    </div>
  );
}