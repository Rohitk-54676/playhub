import { newlyCompletedBoxes } from "./completion";
import { totalH, totalV } from "./grid";

export interface OfflinePlayer {
  id: string;          // "p1", "p2", "p3", "p4"
  label: string;       // "A", "B", "C", "D"
  color: string;       // hex
  name: string;        // "Player 1", "Player 2", etc.
}

export interface OfflineDotsState {
  size: number;
  horizontal: number[];
  vertical: number[];
  lineOwners: Record<string, string>; // "h:5" → "p1"
  boxes: Record<string, { playerId: string; letter: string; color: string }>;
  players: OfflinePlayer[];
  currentTurn: number;   // index into players
  lastLineType: "h" | "v" | null;
  lastLineIdx: number | null;
  winnerId: string | null;
  finished: boolean;
}

export const OFFLINE_COLORS = [
  "#a855f7", // purple
  "#3b82f6", // blue
  "#ec4899", // pink
  "#10b981", // green
];

export const OFFLINE_LETTERS = ["A", "B", "C", "D"];

export function createOfflineGame(
  playerCount: number,
  size: number
): OfflineDotsState {
  const players: OfflinePlayer[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: `p${i + 1}`,
      label: OFFLINE_LETTERS[i],
      color: OFFLINE_COLORS[i],
      name: `Player ${i + 1}`,
    });
  }

  return {
    size,
    horizontal: [],
    vertical: [],
    lineOwners: {},
    boxes: {},
    players,
    currentTurn: 0,
    lastLineType: null,
    lastLineIdx: null,
    winnerId: null,
    finished: false,
  };
}

export function applyOfflineDraw(
  state: OfflineDotsState,
  type: "h" | "v",
  index: number
): OfflineDotsState {
  if (state.finished) return state;

  const hSet = new Set(state.horizontal);
  const vSet = new Set(state.vertical);

  if (type === "h" && hSet.has(index)) return state;
  if (type === "v" && vSet.has(index)) return state;

  const player = state.players[state.currentTurn];
  const newH = [...state.horizontal];
  const newV = [...state.vertical];
  const newOwners = { ...state.lineOwners };

  if (type === "h") {
    newH.push(index);
    hSet.add(index);
    newOwners[`h:${index}`] = player.id;
  } else {
    newV.push(index);
    vSet.add(index);
    newOwners[`v:${index}`] = player.id;
  }

  const completed = newlyCompletedBoxes(
    state.size,
    type,
    index,
    hSet,
    vSet
  );

  const newBoxes = { ...state.boxes };
  for (const boxIdx of completed) {
    newBoxes[String(boxIdx)] = {
      playerId: player.id,
      letter: player.label,
      color: player.color,
    };
  }

  // Check if board is full
  const total = totalH(state.size) + totalV(state.size);
  const drawn = newH.length + newV.length;
  const boardFull = drawn === total;

  let winnerId: string | null = null;
  if (boardFull) {
    const counts: Record<string, number> = {};
    for (const p of state.players) counts[p.id] = 0;
    for (const b of Object.values(newBoxes)) {
      counts[b.playerId] = (counts[b.playerId] ?? 0) + 1;
    }
    let max = -1;
    let tied = false;
    for (const [pid, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        winnerId = pid;
        tied = false;
      } else if (count === max) {
        tied = true;
      }
    }
    if (tied) winnerId = null;
  }

  // Advance turn (stay on same player if a box was completed)
  let nextTurn = state.currentTurn;
  if (completed.length === 0) {
    nextTurn = (state.currentTurn + 1) % state.players.length;
  }

  return {
    ...state,
    horizontal: newH,
    vertical: newV,
    lineOwners: newOwners,
    boxes: newBoxes,
    currentTurn: nextTurn,
    lastLineType: type,
    lastLineIdx: index,
    winnerId,
    finished: boardFull,
  };
}

export function playerBoxCounts(
  state: OfflineDotsState
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of state.players) counts[p.id] = 0;
  for (const b of Object.values(state.boxes)) {
    counts[b.playerId] = (counts[b.playerId] ?? 0) + 1;
  }
  return counts;
}