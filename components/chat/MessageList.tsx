"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import type { ChatMessage, MemberRead } from "@/hooks/useChat";

interface Props {
  messages: ChatMessage[];
  currentUserId: string | null;
  loading?: boolean;
  memberReads?: MemberRead[];
}

export function MessageList({
  messages,
  currentUserId,
  loading,
  memberReads = [],
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          No messages yet. Say hi 👋
        </p>
      </div>
    );
  }

  // Find index of last own message
  const lastOwnIndex = [...messages]
    .reverse()
    .findIndex((m) => m.sender.id === currentUserId);
  const lastOwnIdx =
    lastOwnIndex === -1 ? -1 : messages.length - 1 - lastOwnIndex;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <div className="flex flex-col gap-3">
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showAvatar =
            !prev ||
            prev.sender.id !== m.sender.id ||
            new Date(m.created_at).getTime() -
              new Date(prev.created_at).getTime() >
              5 * 60 * 1000;

          return (
            <MessageBubble
              key={m.id}
              message={m}
              isMine={m.sender.id === currentUserId}
              showAvatar={showAvatar}
              isLastMine={i === lastOwnIdx}
              memberReads={memberReads}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}