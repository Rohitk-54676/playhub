import { prisma } from "@/lib/prisma";
import { allUndrawnLines } from "./completion";
import { applyDraw } from "./engine";

const TURN_TIMEOUT_MS = 30_000;

/**
 * If the current player has been idle for > 30s, auto-draw a random
 * valid line for them. Returns true if a draw was made.
 */
export async function enforceDotsTimeout(roomId: string): Promise<boolean> {
  const game = await prisma.dotsGame.findUnique({ where: { roomId } });
  if (!game) return false;
  if (game.winnerId) return false;

  const elapsed = Date.now() - game.turnStartedAt.getTime();
  if (elapsed < TURN_TIMEOUT_MS) return false;

  const turnOrder = (game.turnOrder as string[]) ?? [];
  if (turnOrder.length === 0) return false;

  const currentPlayerId = turnOrder[game.currentTurn];
  if (!currentPlayerId) return false;

  const horizontal = new Set<number>((game.horizontal as number[]) ?? []);
  const vertical = new Set<number>((game.vertical as number[]) ?? []);

  const lines = allUndrawnLines(game.size, horizontal, vertical);
  if (lines.length === 0) return false;

  const pick = lines[Math.floor(Math.random() * lines.length)];
  await applyDraw(roomId, currentPlayerId, pick.type, pick.index);
  return true;
}

export { TURN_TIMEOUT_MS };