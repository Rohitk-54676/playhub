"use client";

import { useMemo, useRef, useState } from "react";
import { DotsBox } from "./DotsBox";
import type { DotsGameState } from "@/hooks/useDots";

interface Props {
  state: DotsGameState;
  currentUserId: string;
  canDraw: boolean;
  onDraw: (type: "h" | "v", index: number) => void;
}

const BOARD_SIZE = 420;
const PADDING = 30;
const DOT_SNAP = 20; // px radius to snap to a dot

export function DotsBoard({ state, currentUserId, canDraw, onDraw }: Props) {
  const {
    size,
    horizontal,
    vertical,
    lineOwners,
    boxes,
    playerColors,
    lastLineType,
    lastLineIdx,
  } = state;

  const hSet = useMemo(() => new Set(horizontal), [horizontal]);
  const vSet = useMemo(() => new Set(vertical), [vertical]);

  const usable = BOARD_SIZE - PADDING * 2;
  const spacing = usable / (size - 1);

  const dotX = (x: number) => PADDING + x * spacing;
  const dotY = (y: number) => BOARD_SIZE - PADDING - y * spacing;

  const currentPlayerId = state.turnOrder[state.currentTurn];
  const myColor =
    playerColors[currentUserId] ?? playerColors[currentPlayerId] ?? "#a855f7";

  const svgRef = useRef<SVGSVGElement>(null);
  const [startDot, setStartDot] = useState<{ x: number; y: number } | null>(
    null
  );
  const [cursorPt, setCursorPt] = useState<{ x: number; y: number } | null>(
    null
  );
  const [hoverDot, setHoverDot] = useState<{ x: number; y: number } | null>(
    null
  );

  /** Convert a client (mouse/touch) point to SVG coordinates. */
  function toSvgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * BOARD_SIZE;
    const y = ((clientY - rect.top) / rect.height) * BOARD_SIZE;
    return { x, y };
  }

  /** Find the nearest grid dot to an SVG point, if within snap distance. */
  function nearestDot(pt: { x: number; y: number }) {
    let best: { x: number; y: number } | null = null;
    let bestDist = DOT_SNAP;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = pt.x - dotX(x);
        const dy = pt.y - dotY(y);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          best = { x, y };
        }
      }
    }
    return best;
  }

  /** Are these two grid dots adjacent (1 unit apart, not diagonal)? */
  function isAdjacent(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  /** Convert an (a, b) adjacent pair into a line (type, index). */
  function pairToLine(
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): { type: "h" | "v"; index: number } | null {
    // horizontal: same y, x differs by 1
    if (a.y === b.y && Math.abs(a.x - b.x) === 1) {
      const y = a.y;
      const x = Math.min(a.x, b.x);
      return { type: "h", index: y * (size - 1) + x };
    }
    // vertical: same x, y differs by 1
    if (a.x === b.x && Math.abs(a.y - b.y) === 1) {
      const x = a.x;
      const y = Math.min(a.y, b.y);
      return { type: "v", index: y * size + x };
    }
    return null;
  }

  /** Is this line already drawn? */
  function lineDrawn(type: "h" | "v", index: number) {
    return type === "h" ? hSet.has(index) : vSet.has(index);
  }

  // --- Event handlers ---

  function handlePointerDown(e: React.PointerEvent) {
    if (!canDraw) return;
    const pt = toSvgPoint(e.clientX, e.clientY);
    if (!pt) return;
    const dot = nearestDot(pt);
    if (!dot) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setStartDot(dot);
    setCursorPt(pt);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!startDot) return;
    const pt = toSvgPoint(e.clientX, e.clientY);
    if (!pt) return;
    setCursorPt(pt);
    setHoverDot(nearestDot(pt));
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!startDot) return;
    const pt = toSvgPoint(e.clientX, e.clientY);
    const endDot = pt ? nearestDot(pt) : null;

    if (endDot && isAdjacent(startDot, endDot)) {
      const line = pairToLine(startDot, endDot);
      if (line && !lineDrawn(line.type, line.index)) {
        onDraw(line.type, line.index);
      }
    }

    setStartDot(null);
    setCursorPt(null);
    setHoverDot(null);
  }

  // Preview line while dragging
  const previewLine = (() => {
    if (!startDot || !cursorPt) return null;

    // Snap preview target to an adjacent dot if we're near one
    const targetDot =
      hoverDot && isAdjacent(startDot, hoverDot) ? hoverDot : null;

    if (targetDot) {
      const line = pairToLine(startDot, targetDot);
      if (!line || lineDrawn(line.type, line.index)) return null;
      // Draw snapped preview along the grid axis
      if (line.type === "h") {
        const y = Math.floor(line.index / (size - 1));
        const x = line.index % (size - 1);
        return {
          x1: dotX(x),
          y1: dotY(y),
          x2: dotX(x + 1),
          y2: dotY(y),
        };
      } else {
        const y = Math.floor(line.index / size);
        const x = line.index % size;
        return {
          x1: dotX(x),
          y1: dotY(y),
          x2: dotX(x),
          y2: dotY(y + 1),
        };
      }
    }

    // Free-form preview toward cursor
    return {
      x1: dotX(startDot.x),
      y1: dotY(startDot.y),
      x2: cursorPt.x,
      y2: cursorPt.y,
    };
  })();

  return (
    <div className="mx-auto w-full max-w-[420px]">
            <svg
        ref={svgRef}
        viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
        className="w-full select-none"
        style={{
          touchAction: "none",
          cursor: !canDraw
            ? "not-allowed"
            : startDot
            ? "grabbing"
            : "pointer",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Completed boxes */}
        {Object.entries(boxes).map(([key, box]) => {
          const idx = Number(key);
          const row = Math.floor(idx / (size - 1));
          const col = idx % (size - 1);
          const x = dotX(col);
          const y = dotY(row + 1);
          return (
            <DotsBox
              key={key}
              x={x}
              y={y}
              width={spacing}
              height={spacing}
              letter={box.letter}
              color={box.color}
              index={idx}
            />
          );
        })}

        {/* Drawn horizontal lines */}
        {horizontal.map((h) => {
          const y = Math.floor(h / (size - 1));
          const x = h % (size - 1);
          const isLast = lastLineType === "h" && lastLineIdx === h;
          const owner = lineOwners[`h:${h}`];
          const ownerColor = owner
            ? playerColors[owner] ?? "#cbd5e1"
            : "#cbd5e1";
          return (
            <g key={`h-${h}`}>
              <line
                x1={dotX(x)}
                y1={dotY(y)}
                x2={dotX(x + 1)}
                y2={dotY(y)}
                stroke={ownerColor}
                strokeWidth={4}
                strokeLinecap="round"
              />
              {isLast && (
                <line
                  x1={dotX(x)}
                  y1={dotY(y)}
                  x2={dotX(x + 1)}
                  y2={dotY(y)}
                  stroke={ownerColor}
                  strokeWidth={7}
                  strokeLinecap="round"
                  opacity={0.4}
                  style={{
                    filter: `drop-shadow(0 0 6px ${ownerColor})`,
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Drawn vertical lines */}
        {vertical.map((v) => {
          const y = Math.floor(v / size);
          const x = v % size;
          const isLast = lastLineType === "v" && lastLineIdx === v;
          const owner = lineOwners[`v:${v}`];
          const ownerColor = owner
            ? playerColors[owner] ?? "#cbd5e1"
            : "#cbd5e1";
          return (
            <g key={`v-${v}`}>
              <line
                x1={dotX(x)}
                y1={dotY(y)}
                x2={dotX(x)}
                y2={dotY(y + 1)}
                stroke={ownerColor}
                strokeWidth={4}
                strokeLinecap="round"
              />
              {isLast && (
                <line
                  x1={dotX(x)}
                  y1={dotY(y)}
                  x2={dotX(x)}
                  y2={dotY(y + 1)}
                  stroke={ownerColor}
                  strokeWidth={7}
                  strokeLinecap="round"
                  opacity={0.4}
                  style={{
                    filter: `drop-shadow(0 0 6px ${ownerColor})`,
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Preview line while dragging */}
        {previewLine && (
          <line
            x1={previewLine.x1}
            y1={previewLine.y1}
            x2={previewLine.x2}
            y2={previewLine.y2}
            stroke={myColor}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.5}
            strokeDasharray="6 4"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Highlight the start dot */}
        {startDot && (
          <circle
            cx={dotX(startDot.x)}
            cy={dotY(startDot.y)}
            r={10}
            fill={myColor}
            opacity={0.35}
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Highlight the hover target dot */}
        {startDot &&
          hoverDot &&
          isAdjacent(startDot, hoverDot) &&
          (() => {
            const line = pairToLine(startDot, hoverDot);
            if (!line || lineDrawn(line.type, line.index)) return null;
            return (
              <circle
                cx={dotX(hoverDot.x)}
                cy={dotY(hoverDot.y)}
                r={8}
                fill={myColor}
                opacity={0.6}
                style={{ pointerEvents: "none" }}
              />
            );
          })()}

        {/* Dots on top */}
        {Array.from({ length: size * size }).map((_, i) => {
          const y = Math.floor(i / size);
          const x = i % size;
          return (
            <circle
              key={`dot-${i}`}
              cx={dotX(x)}
              cy={dotY(y)}
              r={4}
              fill="currentColor"
              className="text-foreground"
              style={{ pointerEvents: "none" }}
            />
          );
        })}
      </svg>
    </div>
  );
}