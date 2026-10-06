"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  isLast: boolean;
  clickable: boolean;
  onDraw?: () => void;
  hoverColor?: string;
  hitboxWidth?: number;
}

export function DotsLine({
  x1,
  y1,
  x2,
  y2,
  color,
  isLast,
  clickable,
  onDraw,
  hoverColor,
  hitboxWidth = 24,
}: Props) {
  const [hovered, setHovered] = useState(false);

  // Bounding box for the invisible hitbox
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  // Expand hitbox perpendicular to the line direction
  const isHorizontal = y1 === y2;
  const hitboxX = isHorizontal ? minX : minX - hitboxWidth / 2;
  const hitboxY = isHorizontal ? minY - hitboxWidth / 2 : minY;
  const hitboxW = isHorizontal ? maxX - minX || hitboxWidth : hitboxWidth;
  const hitboxH = isHorizontal ? hitboxWidth : maxY - minY || hitboxWidth;

  return (
    <g>
      {/* Visible drawn line */}
      <motion.line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.6 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      />

      {/* Glow overlay when it's the last line */}
      {isLast && (
        <motion.line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.4}
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* Ghost preview on hover (only for undrawn, clickable lines) */}
      {clickable && hovered && hoverColor && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={hoverColor}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.45}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Invisible hitbox for hover + click */}
      {clickable && onDraw && (
        <rect
          x={hitboxX}
          y={hitboxY}
          width={hitboxW}
          height={hitboxH}
          fill="transparent"
          style={{ cursor: "pointer" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onDraw}
        />
      )}
    </g>
  );
}