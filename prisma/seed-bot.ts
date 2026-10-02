import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const bot = await prisma.profile.upsert({
    where: { username: "playhub_bot" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      username: "playhub_bot",
      displayName: "PlayHub Bot",
      isGuest: true,
    },
  });
  console.log("Bot profile ready:", bot.id, bot.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());