"use client";

import { motion } from "framer-motion";

interface Props {
  x: number;      // left edge in px
  y: number;      // top edge in px
  width: number;  // box width
  height: number; // box height
  letter: string;
  color: string;
  index: number;  // for stagger
}

export function DotsBox({ x, y, width, height, letter, color, index }: Props) {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        opacity={0.25}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={Math.min(width, height) * 0.5}
        fontWeight={700}
        fill={color}
        style={{ userSelect: "none", pointerEvents: "none" }}
      >
        {letter}
      </text>
    </motion.g>
  );
}