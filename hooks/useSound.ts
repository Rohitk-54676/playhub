"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSoundStore } from "@/stores/soundStore";

type SoundName = "pick" | "mark" | "win" | "join" | "message";

const SOUND_FILES: Record<SoundName, string> = {
  pick: "/sounds/pick.mp3",
  mark: "/sounds/mark.mp3",
  win: "/sounds/win.mp3",
  join: "/sounds/join.mp3",
  message: "/sounds/message.mp3",
};

const SOUND_VOLUMES: Record<SoundName, number> = {
  pick: 0.35,
  mark: 0.25,
  win: 0.6,
  join: 0.3,
  message: 0.25,
};

export function useSound() {
  const cache = useRef<Map<SoundName, HTMLAudioElement>>(new Map());
  const effectsEnabled = useSoundStore((s) => s.effectsEnabled);

  useEffect(() => {
    Object.entries(SOUND_FILES).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.preload = "auto";
      audio.volume = SOUND_VOLUMES[name as SoundName];
      cache.current.set(name as SoundName, audio);
    });
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (!effectsEnabled) return;
      try {
        const audio = cache.current.get(name);
        if (!audio) return;
        audio.currentTime = 0;
        audio.play().catch(() => {});
      } catch {
        // ignore
      }
    },
    [effectsEnabled]
  );

  return { play };
}