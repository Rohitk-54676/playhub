"use client";

import { track, EVENT } from "@/lib/analytics";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  body: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface TypingUser {
  userId: string;
  username: string;
  at: number;
}

export interface MemberRead {
  userId: string;
  lastReadAt: string; // ISO
}

export function useChat(conversationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [memberReads, setMemberReads] = useState<MemberRead[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingSent = useRef<number>(0);

  const loadHistory = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) {
        setMessages([]);
      } else {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      setMessages([]);
    }
    setLoading(false);
  }, [conversationId]);

  // Load members' lastReadAt
  const loadReads = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(
        `/api/conversations/${conversationId}/reads`
      );
      if (res.ok) {
        const data = await res.json();
        setMemberReads(data);
      }
    } catch {
      // ignore
    }
  }, [conversationId]);

  useEffect(() => {
    loadHistory();
    loadReads();
  }, [loadHistory, loadReads]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "broadcast",
        { event: "new_message" },
        ({ payload }: { payload: ChatMessage }) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            return [...prev, payload];
          });
          // Also mark as read if the tab is visible — user is looking
          if (document.visibilityState === "visible") {
            fetch(`/api/conversations/${conversationId}/read`, {
              method: "POST",
            }).catch(() => {});
          }
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        ({ payload }: { payload: TypingUser }) => {
          setTypingUsers((prev) => {
            const filtered = prev.filter((u) => u.userId !== payload.userId);
            return [...filtered, payload];
          });
        }
      )
      .on(
        "broadcast",
        { event: "read" },
        ({ payload }: { payload: MemberRead }) => {
          setMemberReads((prev) => {
            const filtered = prev.filter((r) => r.userId !== payload.userId);
            return [...filtered, payload];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId]);

  // Expire typing indicators after 3s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => prev.filter((u) => now - u.at < 3000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!conversationId || !body.trim()) return { error: "Empty" };

      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body }),
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { error: err.error ?? "Failed to send" };
        }

        const msg: ChatMessage = await res.json();

        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        track(EVENT.MESSAGE_SENT);

        if (channelRef.current) {
          await channelRef.current.send({
            type: "broadcast",
            event: "new_message",
            payload: msg,
          });
        }

        return { error: null };
      } catch {
        return { error: "Network error" };
      }
    },
    [conversationId]
  );

  const sendTyping = useCallback((userId: string, username: string) => {
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId, username, at: now },
      });
    }
  }, []);

  // Mark as read + broadcast to other members
  const markRead = useCallback(
    async (userId: string) => {
      if (!conversationId) return;
      try {
        await fetch(`/api/conversations/${conversationId}/read`, {
          method: "POST",
        });
        const now = new Date().toISOString();
        // Broadcast
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "read",
            payload: { userId, lastReadAt: now },
          });
        }
        // Update local
        setMemberReads((prev) => {
          const filtered = prev.filter((r) => r.userId !== userId);
          return [...filtered, { userId, lastReadAt: now }];
        });
      } catch {
        // ignore
      }
    },
    [conversationId]
  );

  return {
    messages,
    loading,
    typingUsers,
    memberReads,
    sendMessage,
    sendTyping,
    markRead,
    refresh: loadHistory,
  };
}