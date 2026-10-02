"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SoundState {
  musicEnabled: boolean;
  effectsEnabled: boolean;
  setMusic: (v: boolean) => void;
  setEffects: (v: boolean) => void;
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      musicEnabled: true,
      effectsEnabled: true,
      setMusic: (musicEnabled) => set({ musicEnabled }),
      setEffects: (effectsEnabled) => set({ effectsEnabled }),
    }),
    { name: "playhub-sound" }
  )
);