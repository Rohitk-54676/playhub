"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createUnoClient,
  type UnoRealtimeClient,
} from "@/lib/uno/realtime/client";
import type { UnoEvent } from "@/lib/uno/realtime/events";
import type { UnoGameState, UnoColor } from "@/lib/uno/types";
import { chooseBestCard } from "@/lib/uno/ai";
import {
  acceptPendingDraw,
  callUno,
  catchUno,
  challengeWildDrawFour,
  drawCard,
  endTurn,
  playCard,
  startUnoGame,
} from "@/lib/uno/engine";

interface Options {
  roomCode: string;
  playerId: string;
  playerIds: string[];
  isHost: boolean;
  onLog?: (text: string) => void;
}

export function useUnoRealtime({
  roomCode,
  playerId,
  playerIds,
  isHost,
  onLog,
}: Options) {
  const [state, setState] = useState<UnoGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<UnoRealtimeClient | null>(null);
  const startedRef = useRef(false);
  const stateRef = useRef<UnoGameState | null>(null);
  const onLogRef = useRef(onLog);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    onLogRef.current = onLog;
  }, [onLog]);

  // Connect + subscribe
  useEffect(() => {
    const client = createUnoClient(roomCode, playerId, () => {
      setConnected(true);
    });
    clientRef.current = client;

    const unsubscribe = client.subscribe("*", (event: UnoEvent) => {
      if (event.state) setState(event.state);
      if (event.log && onLogRef.current) onLogRef.current(event.log);
    });

    return () => {
      unsubscribe();
      client.disconnect();
      clientRef.current = null;
      setConnected(false);
    };
  }, [roomCode, playerId]);

  // Host starts the game with a small delay so guests can subscribe first.
  useEffect(() => {
    if (!isHost) return;
    if (!connected) return;
    if (startedRef.current) return;
    if (stateRef.current) return;

    startedRef.current = true;

    const timer = setTimeout(() => {
      const fresh = startUnoGame(playerIds);
      setState(fresh);
      stateRef.current = fresh;

      clientRef.current?.send({
        type: "game_start",
        at: new Date().toISOString(),
        by: playerId,
        state: fresh,
        log: "Game started",
      });

      // Backup broadcast in case first one missed
      setTimeout(() => {
        const cur = stateRef.current;
        if (cur) {
          clientRef.current?.send({
            type: "state_sync",
            at: new Date().toISOString(),
            by: playerId,
            state: cur,
          });
        }
      }, 800);
    }, 500);

    return () => clearTimeout(timer);
  }, [isHost, connected, playerIds, playerId]);

  // Host broadcasts state periodically so guests always catch up.
  useEffect(() => {
    if (!isHost) return;
    if (!connected) return;

    const interval = setInterval(() => {
      const cur = stateRef.current;
      if (!cur) return;
      if (cur.phase === "finished") return;

      clientRef.current?.send({
        type: "state_sync",
        at: new Date().toISOString(),
        by: playerId,
        state: cur,
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isHost, connected, playerId]);

  const broadcast = useCallback(
    async (type: UnoEvent["type"], newState: UnoGameState, log?: string) => {
      setState(newState);
      stateRef.current = newState;
      await clientRef.current?.send({
        type,
        at: new Date().toISOString(),
        by: playerId,
        state: newState,
        log,
      });
    },
    [playerId]
  );

  // Host enforces the 15s turn timer.
  // When time expires, the host plays for the AFK player:
  //   1. Play the best playable card from their hand
  //   2. If no playable card, draw 1 (and play it if playable)
  //   3. If still nothing, end turn
  useEffect(() => {
    if (!isHost) return;
    if (!connected) return;

    const interval = setInterval(async () => {
      const cur = stateRef.current;
      if (!cur) return;
      if (cur.phase !== "playing") return;
      if (!cur.turnStartedAt) return;

      const elapsed = Date.now() - new Date(cur.turnStartedAt).getTime();
      if (elapsed < 15_000) return;

      const currentId = cur.players[cur.currentPlayerIndex]?.id;
      if (!currentId) return;

      // If a pending draw is on the current player, auto-accept it
      if (cur.pendingType && cur.pendingPlayerId === currentId) {
        const newState = acceptPendingDraw(cur, currentId);
        await broadcast(
          "pending_draw_accepted",
          newState,
          "auto-accepted (timeout)"
        );
        return;
      }

      // Try to play the best card from their hand
      const me = cur.players.find((p) => p.id === currentId);
      if (!me) return;

      const best = chooseBestCard(me.hand, cur, currentId);
      if (best) {
        const playResult = playCard(
          cur,
          currentId,
          best.card.id,
          best.chosenColor
        );
        if (!playResult.error) {
          await broadcast(
            "card_played",
            playResult.newState,
            "auto-played (timeout)"
          );
          return;
        }
        // If auto-play failed, fall through to draw
      }

      // No playable card — draw 1
      const { newState: afterDraw, drawnCard, drawnCardPlayable } = drawCard(
        cur,
        currentId
      );

      let finalState = afterDraw;
      let logMessage = "auto-drew (timeout)";

      if (drawnCardPlayable && drawnCard) {
        let chosenColor: UnoColor | undefined;
        if (
          drawnCard.type === "wild" ||
          drawnCard.type === "wild_draw_four"
        ) {
          const colors: UnoColor[] = ["red", "yellow", "green", "blue"];
          chosenColor = colors[Math.floor(Math.random() * 4)];
        }

        const playResult = playCard(
          afterDraw,
          currentId,
          drawnCard.id,
          chosenColor
        );

        if (!playResult.error) {
          finalState = playResult.newState;
          logMessage = "auto-played after draw (timeout)";
        } else {
          finalState = endTurn(afterDraw, currentId);
        }
      } else {
        finalState = endTurn(afterDraw, currentId);
      }

      await broadcast("card_drawn", finalState, logMessage);
    }, 2000);

    return () => clearInterval(interval);
  }, [isHost, connected, broadcast]);

  const play = useCallback(
    async (cardId: string, chosenColor?: UnoColor) => {
      const cur = stateRef.current;
      if (!cur) return { error: "No game" };
      const me = cur.players.find((p) => p.id === playerId);
      const card = me?.hand.find((c) => c.id === cardId);

      const { newState, error } = playCard(cur, playerId, cardId, chosenColor);
      if (error) return { error };

      const cardLabel = card
        ? `${card.color ?? ""} ${
            card.type === "number"
              ? card.value
              : card.type === "draw_two"
              ? "+2"
              : card.type === "wild_draw_four"
              ? "+4"
              : card.type
          }`
        : "a card";

      await broadcast("card_played", newState, `played ${cardLabel}`);
      return { error: null };
    },
    [playerId, broadcast]
  );

  const draw = useCallback(async () => {
    const cur = stateRef.current;
    if (!cur) return { error: "No game", drawnCardPlayable: false };
    const { newState, drawnCard, drawnCardPlayable, error } = drawCard(
      cur,
      playerId
    );
    if (error) return { error, drawnCardPlayable: false };

    // If the drawn card is NOT playable, auto-pass the turn.
    let finalState = newState;
    if (!drawnCardPlayable) {
      finalState = endTurn(newState, playerId);
    }

    await broadcast(
      "card_drawn",
      finalState,
      drawnCardPlayable
        ? "drew a card — can play it or pass"
        : "drew a card (unplayable) — turn passed"
    );
    return { error: null, drawnCard, drawnCardPlayable };
  }, [playerId, broadcast]);

  const passTurn = useCallback(async () => {
    const cur = stateRef.current;
    if (!cur) return { error: "No game" };
    const newState = endTurn(cur, playerId);
    await broadcast("turn_ended", newState);
    return { error: null };
  }, [playerId, broadcast]);

  const uno = useCallback(async () => {
    const cur = stateRef.current;
    if (!cur) return;
    const newState = callUno(cur, playerId);
    await broadcast("uno_called", newState, "called UNO!");
  }, [playerId, broadcast]);

  const catchPlayer = useCallback(
    async (targetId: string) => {
      const cur = stateRef.current;
      if (!cur) return { error: "No game" };
      const { newState, error } = catchUno(cur, targetId);
      if (error) return { error };
      await broadcast("uno_caught", newState, "caught someone without UNO");
      return { error: null };
    },
    [broadcast]
  );

  const acceptDraw = useCallback(async () => {
    const cur = stateRef.current;
    if (!cur) return;
    const newState = acceptPendingDraw(cur, playerId);
    await broadcast("pending_draw_accepted", newState, "accepted the draw");
  }, [playerId, broadcast]);

  const challenge = useCallback(async () => {
    const cur = stateRef.current;
    if (!cur) return { result: null };
    const { newState, result, error } = challengeWildDrawFour(cur, playerId);
    if (error) return { result: null, error };
    const logLine =
      result === "guilty"
        ? "challenge succeeded — player was bluffing"
        : "challenge failed — cards drawn as penalty";
    await broadcast("challenge_resolved", newState, logLine);
    return { result };
  }, [playerId, broadcast]);

  return {
    state,
    connected,
    play,
    draw,
    passTurn,
    uno,
    catchPlayer,
    acceptDraw,
    challenge,
  };
}