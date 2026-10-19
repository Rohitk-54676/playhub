"use client";

interface Props {
  size?: number;
  className?: string;
}

export function UnoCardBack({ size = 18, className }: Props) {
  return (
    <svg
      viewBox="0 0 100 150"
      width={size}
      height={size * 1.5}
      className={className}
    >
      <rect
        x="2"
        y="2"
        width="96"
        height="146"
        rx="8"
        fill="#0f172a"
        stroke="white"
        strokeWidth="4"
      />
      <ellipse
        cx="50"
        cy="75"
        rx="28"
        ry="45"
        fill="none"
        stroke="white"
        strokeWidth="2"
        transform="rotate(-20 50 75)"
      />
    </svg>
  );
}