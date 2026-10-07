"use client";

/**
 * Track a client-side event. Fire-and-forget — never blocks UI.
 * Safe to call even if the user is a guest or not signed in.
 */
export function track(
  eventType: string,
  metadata?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, metadata }),
      keepalive: true, // fire even if page is unloading
    }).catch(() => {});
  } catch {
    // ignore
  }
}

/** Server-side event types we track */
export const EVENT = {
  SIGNUP: "user_signed_up",
  LOGIN: "user_logged_in",
  GUEST_LOGIN: "guest_logged_in",
  ROOM_CREATED: "room_created",
  ROOM_JOINED: "room_joined",
  GAME_STARTED: "game_started",
  GAME_FINISHED: "game_finished",
  MESSAGE_SENT: "message_sent",
  FRIEND_REQUEST: "friend_request_sent",
  FRIEND_ACCEPTED: "friend_accepted",
  PAGE_VIEW: "page_view",
} as const;

export type EventType = (typeof EVENT)[keyof typeof EVENT];