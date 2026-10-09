export interface GameMeta {
  id: string;
  name: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  avgTime: string;
  description: string;
  color: string;
  available: boolean;
}

export const GAMES: GameMeta[] = [
  {
    id: "bingo",
    name: "Bingo",
    icon: "🎱",
    minPlayers: 2,
    maxPlayers: 10,
    avgTime: "10–30 min",
    description:
      "Turn-based Bingo with a twist. Pick numbers from your card, race to complete 5 lines.",
    color: "from-purple-500 to-pink-500",
    available: true,
  },
  {
    id: "tic-tac-toe",
    name: "Tic Tac Toe",
    icon: "❌⭕",
    minPlayers: 2,
    maxPlayers: 2,
    avgTime: "~1 min",
    description: "Classic 3×3. First to 3 in a row wins.",
    color: "from-blue-500 to-cyan-500",
    available: true,
  },
      {
    id: "dots-and-boxes",
    name: "Dots & Boxes",
    icon: "🔵🔴",
    minPlayers: 2,
    maxPlayers: 4,
    avgTime: "5–15 min",
    description: "Draw lines, complete squares, and claim them with your letter.",
    color: "from-orange-500 to-red-500",
    available: true,
  },
];

export function getGame(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id);
}