import { prisma } from "@/lib/prisma";
import { countLines } from "./lines";

const PICK_TIMEOUT_MS = 15_000;

/**
 * Check if the current turn has expired and, if so, force a random pick
 * for the current player. Returns true if an action was taken.
 */
export async function enforcePickTimeout(roomId: string): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: { orderBy: { joinedAt: "asc" } } },
  });
  if (!room || room.status !== "playing") return false;

  const allPicks = await prisma.bingoPick.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
  });

  const lastPick = allPicks.length > 0 ? allPicks[allPicks.length - 1] : null;
  const turnStartAt = lastPick
    ? lastPick.createdAt.getTime()
    : room.createdAt.getTime();

  const timeoutMs = lastPick ? 15_000 : 20_000;
  if (Date.now() - turnStartAt < timeoutMs) return false;

  const turnOrder = room.players.map((p) => p.userId);
  if (turnOrder.length === 0) return false;

  const currentIdx = allPicks.length % turnOrder.length;
  const currentUserId = turnOrder[currentIdx];

  const card = await prisma.bingoCard.findUnique({
    where: { roomId_userId: { roomId, userId: currentUserId } },
  });
  if (!card) return false;

  const calledSet = new Set(allPicks.map((p) => p.number));
  const availableIndices = Array.from({ length: 25 }, (_, i) => i).filter(
    (i) => !card.marked.includes(i) && !calledSet.has(card.numbers[i])
  );
  if (availableIndices.length === 0) return false;

  const pickIdx =
    availableIndices[Math.floor(Math.random() * availableIndices.length)];
  const number = card.numbers[pickIdx];

  await prisma.bingoPick.create({
    data: { roomId, userId: currentUserId, number },
  });

  const allCards = await prisma.bingoCard.findMany({ where: { roomId } });
  await Promise.all(
    allCards
      .filter((c) => {
        const idx = c.numbers.indexOf(number);
        return idx !== -1 && !c.marked.includes(idx);
      })
      .map((c) => {
        const idx = c.numbers.indexOf(number);
        const newMarked = [...c.marked, idx];
        return prisma.bingoCard.update({
          where: { id: c.id },
          data: { marked: newMarked, lines: countLines(newMarked) },
        });
      })
  );

  return true;
}

export { PICK_TIMEOUT_MS };