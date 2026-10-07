"use client";

import { track, EVENT } from "@/lib/analytics";
import type { Friend, FriendRequest, FriendStatus } from "@/lib/types";

export async function searchUsers(q: string): Promise<
  { id: string; username: string; display_name: string | null; avatar_url: string | null }[]
> {
  if (q.trim().length < 2) return [];
  try {
    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getFriends(): Promise<Friend[]> {
  try {
    const res = await fetch("/api/friends");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getPendingRequests(): Promise<FriendRequest[]> {
  try {
    const res = await fetch("/api/friends/pending");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function getFriendStatus(userId: string): Promise<FriendStatus> {
  try {
    const res = await fetch(`/api/friends/status?userId=${userId}`);
    if (!res.ok) return "none";
    const data = await res.json();
    return data.status as FriendStatus;
  } catch {
    return "none";
  }
}

export async function sendFriendRequest(
  targetId: string
): Promise<{ error: string | null }> {
  try {
    const res = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    track(EVENT.FRIEND_REQUEST);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error ?? "Failed to send request" };
    }
    return { error: null };
  } catch {
    return { error: "Network error" };
  }
}

export async function respondToRequest(
  friendshipId: string,
  action: "accept" | "decline"
): Promise<{ error: string | null }> {
  try {
    const res = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendshipId, action }),
    });
    track(EVENT.FRIEND_ACCEPTED);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error ?? "Failed to respond" };
    }
    return { error: null };
  } catch {
    return { error: "Network error" };
  }
}