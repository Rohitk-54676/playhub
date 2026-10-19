"use client";

import { motion } from "framer-motion";
import type { UnoCard, UnoColor } from "@/lib/uno/types";
import { cn } from "@/lib/utils";

export const COLOR_FILLS: Record<UnoColor | "wild", string> = {
  red: "#dc2626",
  yellow: "#f59e0b",
  green: "#16a34a",
  blue: "#2563eb",
  wild: "#1f2937",
};

interface Props {
  card: UnoCard;
  size?: "sm" | "md" | "lg";
  faceDown?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  className?: string;
  animateIn?: boolean;
}

const SIZES = {
  sm: { w: 40, h: 60, font: 16, corner: 6 },
  md: { w: 64, h: 96, font: 24, corner: 8 },
  lg: { w: 88, h: 132, font: 34, corner: 10 },
};

export function UnoCardFace({
  card,
  size = "md",
  faceDown = false,
  highlighted = false,
  dimmed = false,
  onClick,
  className,
  animateIn = false,
}: Props) {
  const s = SIZES[size];
  const isWild = card.color === "wild";

  const label = (() => {
    if (card.type === "number") return String(card.value ?? "");
    if (card.type === "skip") return "⊘";
    if (card.type === "reverse") return "⇄";
    if (card.type === "draw_two") return "+2";
    if (card.type === "wild") return "★";
    if (card.type === "wild_draw_four") return "+4";
    return "?";
  })();

  const cornerLabel = (() => {
    if (card.type === "number") return String(card.value ?? "");
    if (card.type === "skip") return "S";
    if (card.type === "reverse") return "R";
    if (card.type === "draw_two") return "+2";
    if (card.type === "wild") return "W";
    if (card.type === "wild_draw_four") return "+4";
    return "?";
  })();

  const bg = faceDown
    ? "#0f172a"
    : isWild
    ? COLOR_FILLS.wild
    : COLOR_FILLS[card.color as UnoColor];

  const Wrapper = onClick ? motion.button : motion.div;

  const animateProps = animateIn
    ? {
        initial: { y: -80, opacity: 0, rotate: -15, scale: 0.7 },
        animate: { y: 0, opacity: 1, rotate: 0, scale: 1 },
        transition: { type: "spring" as const, stiffness: 300, damping: 20 },
      }
    : {};

  return (
    <Wrapper
      {...(onClick
        ? {
            type: "button" as const,
            onClick,
            whileHover: highlighted ? { y: -8 } : undefined,
            whileTap: highlighted ? { scale: 0.96 } : undefined,
          }
        : {})}
      {...animateProps}
      className={cn(
        "relative shrink-0 select-none",
        onClick && "cursor-pointer",
        !onClick && "cursor-default",
        highlighted &&
          "ring-2 ring-offset-2 ring-offset-background ring-yellow-400",
        dimmed && "opacity-60 saturate-50",
        className
      )}
      style={{
        width: s.w,
        height: s.h,
      }}
    >
      <svg
        viewBox="0 0 100 150"
        width={s.w}
        height={s.h}
        className="drop-shadow-md"
      >
        <rect
          x="2"
          y="2"
          width="96"
          height="146"
          rx={s.corner}
          fill={bg}
          stroke="white"
          strokeWidth="3"
        />

        {faceDown ? (
          <>
            <ellipse
              cx="50"
              cy="75"
              rx="30"
              ry="45"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              transform="rotate(-20 50 75)"
            />
            <text
              x="50"
              y="82"
              textAnchor="middle"
              fontSize="26"
              fontWeight="bold"
              fill="white"
              fontFamily="system-ui"
            >
              UNO
            </text>
          </>
        ) : isWild ? (
          <>
            <g>
              <rect x="6" y="6" width="44" height="69" fill="#dc2626" />
              <rect x="50" y="6" width="44" height="69" fill="#2563eb" />
              <rect x="6" y="75" width="44" height="69" fill="#f59e0b" />
              <rect x="50" y="75" width="44" height="69" fill="#16a34a" />
            </g>
            <ellipse cx="50" cy="75" rx="28" ry="42" fill="white" />
            <text
              x="50"
              y={card.type === "wild_draw_four" ? 78 : 88}
              textAnchor="middle"
              fontSize={card.type === "wild_draw_four" ? 28 : 34}
              fontWeight="bold"
              fill="#1f2937"
              fontFamily="system-ui"
            >
              {label}
            </text>
            <text
              x="14"
              y="26"
              fontSize="16"
              fontWeight="bold"
              fill="white"
              fontFamily="system-ui"
            >
              {cornerLabel}
            </text>
            <text
              x="86"
              y="140"
              textAnchor="end"
              fontSize="16"
              fontWeight="bold"
              fill="white"
              fontFamily="system-ui"
            >
              {cornerLabel}
            </text>
          </>
        ) : (
          <>
            <ellipse cx="50" cy="75" rx="32" ry="45" fill="white" />
            <text
              x="50"
              y={card.type === "draw_two" ? 88 : 88}
              textAnchor="middle"
              fontSize={card.type === "number" ? 40 : 34}
              fontWeight="bold"
              fill={bg}
              fontFamily="system-ui"
            >
              {label}
            </text>
            <text
              x="14"
              y="26"
              fontSize="16"
              fontWeight="bold"
              fill="white"
              fontFamily="system-ui"
            >
              {cornerLabel}
            </text>
            <text
              x="86"
              y="140"
              textAnchor="end"
              fontSize="16"
              fontWeight="bold"
              fill="white"
              fontFamily="system-ui"
            >
              {cornerLabel}
            </text>
          </>
        )}
      </svg>
    </Wrapper>
  );
}