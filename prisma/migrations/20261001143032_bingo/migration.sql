-- CreateTable
CREATE TABLE "bingo_cards" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "numbers" INTEGER[],
    "marked" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "lines" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bingo_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bingo_picks" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bingo_picks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bingo_cards_room_id_idx" ON "bingo_cards"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "bingo_cards_room_id_user_id_key" ON "bingo_cards"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "bingo_picks_room_id_created_at_idx" ON "bingo_picks"("room_id", "created_at");

-- AddForeignKey
ALTER TABLE "bingo_cards" ADD CONSTRAINT "bingo_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bingo_picks" ADD CONSTRAINT "bingo_picks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
