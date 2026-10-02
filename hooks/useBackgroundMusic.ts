"use client";

import { useEffect, useRef } from "react";
import { useSoundStore } from "@/stores/soundStore";

let bgmAudio: HTMLAudioElement | null = null;

export function useBackgroundMusic() {
  const startedRef = useRef(false);
  const musicEnabled = useSoundStore((s) => s.musicEnabled);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!bgmAudio) {
      bgmAudio = new Audio("/sounds/bgm.mp3");
      bgmAudio.loop = true;
      bgmAudio.volume = 0.15;
    }

    // Music turned OFF — pause and reset the "started" flag
    if (!musicEnabled) {
      bgmAudio.pause();
      startedRef.current = false;
      return;
    }

    // Music turned ON — try to resume immediately
    if (bgmAudio.paused) {
      // Try to play right now (works if browser still allows due to prior interaction)
      bgmAudio.play().then(() => {
        startedRef.current = true;
      }).catch(() => {
        // Browser blocked — attach click listener as fallback
        startedRef.current = false;
      });
    }

    // If already playing, nothing to do
    if (startedRef.current) return;

    const start = () => {
      if (!bgmAudio) return;
      bgmAudio.play().then(() => {
        startedRef.current = true;
      }).catch(() => {
        // still blocked
      });
      document.removeEventListener("click", start);
      document.removeEventListener("touchstart", start);
      document.removeEventListener("keydown", start);
    };

    document.addEventListener("click", start);
    document.addEventListener("touchstart", start);
    document.addEventListener("keydown", start);

    return () => {
      document.removeEventListener("click", start);
      document.removeEventListener("touchstart", start);
      document.removeEventListener("keydown", start);
    };
  }, [musicEnabled]);
}

export function toggleBackgroundMusic() {
  if (!bgmAudio) return false;
  if (bgmAudio.paused) {
    bgmAudio.play().catch(() => {});
    return true;
  } else {
    bgmAudio.pause();
    return false;
  }
}

export function isBackgroundMusicPlaying() {
  return bgmAudio ? !bgmAudio.paused : false;
}