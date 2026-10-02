import { prisma } from "@/lib/prisma";
import { chooseBotPick, BOT_USERNAME } from "./ai";
import { countLines } from "./lines";

/**
 * If the current turn belongs to a bot, take the bot's turn.
 * Returns true if a bot action was performed.
 */
export async function maybeTakeBotTurn(roomId: string): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { players: { orderBy: { joinedAt: "asc" } } },
  });
  if (!room || room.status !== "playing") return false;

  const picks = await prisma.bingoPick.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
  });

  const turnOrder = room.players.map((p) => p.userId);
  if (turnOrder.length === 0) return false;

  const currentIdx = picks.length % turnOrder.length;
  const currentUserId = turnOrder[currentIdx];
  const currentPlayer = room.players.find((p) => p.userId === currentUserId);
  if (!currentPlayer || !currentPlayer.isBot) return false;

  // Find the bot's card
  const botCard = await prisma.bingoCard.findUnique({
    where: { roomId_userId: { roomId, userId: currentUserId } },
  });
  if (!botCard) return false;

  const calledNumbers = picks.map((p) => p.number);
  const cellIndex = chooseBotPick(
    botCard.numbers,
    botCard.marked,
    calledNumbers
  );
  if (cellIndex === -1) return false;

  const number = botCard.numbers[cellIndex];

  // Create the pick
  await prisma.bingoPick.create({
    data: { roomId, userId: currentUserId, number },
  });

  // Update all cards in parallel
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

  // Check if the bot just won
  const updatedBotCard = await prisma.bingoCard.findUnique({
    where: { roomId_userId: { roomId, userId: currentUserId } },
  });
  if (updatedBotCard && countLines(updatedBotCard.marked) >= 5) {
    await prisma.room.update({
      where: { id: roomId },
      data: {
        status: "finished",
        state: {
          winnerId: currentUserId,
          winningLines: [],
          finishedAt: new Date().toISOString(),
        } as object,
      },
    });
  }

  return true;
}

export async function getBotProfile() {
  return prisma.profile.findUnique({
    where: { username: BOT_USERNAME },
  });
}