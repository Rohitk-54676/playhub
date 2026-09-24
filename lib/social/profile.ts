"use client";

import type { Profile } from "@/lib/types";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const res = await fetch(`/api/profile?id=${userId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchProfileByUsername(
  username: string
): Promise<Profile | null> {
  try {
    const res = await fetch(`/api/profile?username=${username}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateProfile(
  userId: string,
  updates: Partial<
    Pick<Profile, "username" | "display_name" | "avatar_url" | "accent">
  >
): Promise<{ error: string | null; profile: Profile | null }> {
  try {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error ?? "Failed to update", profile: null };
    }

    const profile = await res.json();
    return { error: null, profile };
  } catch (e) {
    // Network error or request aborted
    console.error("updateProfile failed:", e);
    return { error: "Network error — please try again", profile: null };
  }
}