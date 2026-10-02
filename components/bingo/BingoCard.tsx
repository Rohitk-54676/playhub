"use client";

import { BingoCell } from "./BingoCell";
import { ALL_LINES } from "@/lib/bingo/lines";

interface Props {
  numbers: number[];
  marked: number[];
  clickable: boolean;
  onMark?: (cellIndex: number) => void;
}

const HEADERS = ["B", "I", "N", "G", "O"];

export function BingoCard({ numbers, marked, clickable, onMark }: Props) {
  const markedSet = new Set(marked);

  const completedLineIndices = new Set<number>();
  for (const line of ALL_LINES) {
    if (line.every((i) => markedSet.has(i))) {
      line.forEach((i) => completedLineIndices.add(i));
    }
  }

  return (
    <div className="flex w-full max-w-[min(100%,420px)] flex-col gap-1">
      {/* Headers */}
      <div className="grid grid-cols-5 gap-1">
        {HEADERS.map((h) => (
          <div
            key={h}
            className="flex h-6 items-center justify-center rounded bg-accent/10 text-[10px] font-bold text-accent"
          >
            {h}
          </div>
        ))}
      </div>

      {/* 5×5 grid */}
      <div className="grid grid-cols-5 gap-1">
        {numbers.map((n, i) => (
          <BingoCell
            key={i}
            number={n}
            marked={markedSet.has(i)}
            highlighted={completedLineIndices.has(i)}
            clickable={clickable && !markedSet.has(i)}
            onMark={onMark ? () => onMark(i) : undefined}
          />
        ))}
      </div>
    </div>
  );
}