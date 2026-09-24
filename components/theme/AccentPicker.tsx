"use client";

import { Check } from "lucide-react";
import { useThemeStore, type Accent } from "@/stores/themeStore";
import { cn } from "@/lib/utils";

const ACCENTS: { id: Accent; label: string; color: string }[] = [
  { id: "purple", label: "Purple", color: "rgb(168 85 247)" },
  { id: "blue",   label: "Blue",   color: "rgb(59 130 246)" },
  { id: "green",  label: "Green",  color: "rgb(34 197 94)" },
  { id: "pink",   label: "Pink",   color: "rgb(236 72 153)" },
  { id: "orange", label: "Orange", color: "rgb(249 115 22)" },
  { id: "teal",   label: "Teal",   color: "rgb(20 184 166)" },
];

export function AccentPicker() {
  const accent = useThemeStore((s) => s.accent);
  const setAccent = useThemeStore((s) => s.setAccent);

  return (
    <div className="flex flex-wrap gap-3">
      {ACCENTS.map((a) => (
        <button
          key={a.id}
          onClick={() => setAccent(a.id)}
          aria-label={a.label}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110",
            accent === a.id && "ring-2 ring-offset-2 ring-offset-background"
          )}
          style={{
            backgroundColor: a.color,
            // @ts-expect-error CSS var injection
            "--tw-ring-color": a.color,
          }}
        >
          {accent === a.id && <Check className="h-5 w-5 text-white" />}
        </button>
      ))}
    </div>
  );
}