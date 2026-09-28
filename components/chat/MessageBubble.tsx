"use client";

import { Check, CheckCheck } from "lucide-react";
import { UserAvatar } from "@/components/social/UserAvatar";
import type { ChatMessage, MemberRead } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface Props {
  message: ChatMessage;
  isMine: boolean;
  showAvatar: boolean;
  isLastMine?: boolean;
  memberReads?: MemberRead[];
}

export function MessageBubble({
  message,
  isMine,
  showAvatar,
  isLastMine,
  memberReads = [],
}: Props) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Determine "seen" state: has ANY other member read past this message?
  const msgTime = new Date(message.created_at).getTime();
  const seenByOthers = memberReads.some(
    (r) => r.userId !== message.sender.id && new Date(r.lastReadAt).getTime() >= msgTime
  );

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isMine ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isMine && (
        <div className="w-8 shrink-0">
          {showAvatar && (
            <UserAvatar
              username={message.sender.username}
              displayName={message.sender.display_name}
              avatarUrl={message.sender.avatar_url}
              size="sm"
            />
          )}
        </div>
      )}

      <div className={cn("flex max-w-[70%] flex-col", isMine && "items-end")}>
        {!isMine && showAvatar && (
          <span className="mb-1 px-1 text-xs font-medium text-muted-foreground">
            {message.sender.display_name ?? message.sender.username}
          </span>
        )}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm",
            isMine
              ? "rounded-br-sm bg-accent text-accent-fg"
              : "rounded-bl-sm bg-muted text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </div>

        <div className="mt-0.5 flex items-center gap-1 px-1">
          <span className="text-[10px] text-muted-foreground">{time}</span>
          {isMine && isLastMine && (
            <span
              className={cn(
                "flex items-center",
                seenByOthers ? "text-accent" : "text-muted-foreground"
              )}
            >
              {seenByOthers ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}