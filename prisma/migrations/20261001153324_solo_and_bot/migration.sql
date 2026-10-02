-- AlterTable
ALTER TABLE "room_players" ADD COLUMN     "is_bot" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "is_solo" BOOLEAN NOT NULL DEFAULT false;
