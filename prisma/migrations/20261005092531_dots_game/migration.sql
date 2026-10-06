-- CreateTable
CREATE TABLE "dots_games" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 5,
    "horizontal" JSONB NOT NULL DEFAULT '[]',
    "vertical" JSONB NOT NULL DEFAULT '[]',
    "boxes" JSONB NOT NULL DEFAULT '{}',
    "playerColors" JSONB NOT NULL DEFAULT '{}',
    "playerLetters" JSONB NOT NULL DEFAULT '{}',
    "turnOrder" JSONB NOT NULL DEFAULT '[]',
    "currentTurn" INTEGER NOT NULL DEFAULT 0,
    "last_line_type" TEXT,
    "last_line_idx" INTEGER,
    "winner_id" UUID,
    "turn_started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dots_games_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dots_games_room_id_key" ON "dots_games"("room_id");
