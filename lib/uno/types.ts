export type UnoColor = "red" | "yellow" | "green" | "blue";
export type WildColor = "wild"; // not a real color — used for wild cards

export type UnoCardType =
  | "number"   // 0-9
  | "skip"
  | "reverse"
  | "draw_two"
  | "wild"
  | "wild_draw_four";

export interface UnoCard {
  id: string;           // unique id, e.g. "red-5-2"
  color: UnoColor | WildColor;
  type: UnoCardType;
  value?: number;       // only for number cards (0-9)
}

export type PlayerId = string; // user id

export interface UnoPlayer {
  id: PlayerId;
  hand: UnoCard[];
  calledUno: boolean;   // has this player called UNO?
  finished: boolean;    // has this player emptied their hand?
  placement: number | null; // 1st, 2nd, 3rd... or null if still playing
}

export type UnoDirection = 1 | -1; // 1 = clockwise, -1 = counter-clockwise

export type UnoGamePhase = "playing" | "finished";

export interface UnoGameState {
  players: UnoPlayer[];              // in turn order
  drawPile: UnoCard[];
  discardPile: UnoCard[];            // top card = last element
  currentPlayerIndex: number;        // index into players
  direction: UnoDirection;
  currentColor: UnoColor;            // active color (may differ from top card if Wild was played)
  phase: UnoGamePhase;
  pendingDraw: number;               // cards that next player must draw (for Draw Two / Wild Draw Four)
  pendingType: "draw_two" | "wild_draw_four" | null;
  pendingPlayerId: PlayerId | null;  // who must draw
  wildDrawFourChallengeOpen: boolean;// true if next player can challenge
  lastPlayedBy: PlayerId | null;     // who made the last move (for challenge verification)
  winner: PlayerId | null;
    /** ISO timestamp of when the current turn started */
  turnStartedAt?: string;
}

export interface PlayResult {
  newState: UnoGameState;
  error?: string;
}