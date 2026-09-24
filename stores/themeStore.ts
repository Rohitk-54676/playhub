"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Accent = "purple" | "blue" | "green" | "pink" | "orange" | "teal";
export type Mode = "light" | "dark" | "system";

interface ThemeState {
  accent: Accent;
  mode: Mode;
  setAccent: (accent: Accent) => void;
  setMode: (mode: Mode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      accent: "purple",
      mode: "system",
      setAccent: (accent) => set({ accent }),
      setMode: (mode) => set({ mode }),
    }),
    { name: "playhub-theme" }
  )
);