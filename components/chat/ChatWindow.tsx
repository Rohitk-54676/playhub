"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useUser } from "@/hooks/useUser";
import { useSound } from "@/hooks/useSound";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { UserAvatar } from "@/components/social/UserAvatar";

interface ConversationInfo {
  id: string;
  type: string;
  name: string | null;
  avatar_url: string | null;
  members: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  }[];
}

interface Props {
  conversation: ConversationInfo;
}

export function ChatWindow({ conversation }: Props) {
  const { user } = useUser();
  const { play } = useSound();
  const prevMessageCount = useRef(0);

  const {
    messages,
    loading,
    typingUsers,
    memberReads,
    sendMessage,
    sendTyping,
    markRead,
  } = useChat(conversation.id);

  // Mark as read on open + when tab regains focus
  useEffect(() => {
    if (!user) return;
    markRead(user.id);

    const handleFocus = () => markRead(user.id);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") markRead(user.id);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [conversation.id, user, markRead]);

  // Mark as read when new messages arrive while tab is visible
  useEffect(() => {
    if (!user) return;
    if (document.visibilityState === "visible") {
      markRead(user.id);
    }
  }, [messages.length, user, markRead]);

  // Play sound when a new message arrives from someone else
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender.id !== user?.id) {
        play("message");
      }
    }
    prevMessageCount.current = messages.length;
  }, [messages, user, play]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b bg-card px-4 py-3">
        <Link
          href="/messages"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted md:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        {conversation.type === "direct" && conversation.members[0] ? (
          <UserAvatar
            username={conversation.members[0].username}
            displayName={conversation.members[0].display_name}
            avatarUrl={conversation.members[0].avatar_url}
            size="sm"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-fg">
            <Users className="h-4 w-4" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {conversation.name ?? "Conversation"}
          </p>
          {conversation.type === "group" && (
            <p className="text-xs text-muted-foreground">
              {conversation.members.length} members
            </p>
          )}
        </div>
      </div>

      <MessageList
        messages={messages}
        currentUserId={user?.id ?? null}
        loading={loading}
        memberReads={memberReads}
      />

      <TypingIndicator
        users={typingUsers}
        currentUserId={user?.id ?? null}
      />

      <MessageInput
        onSend={sendMessage}
        onTyping={() =>
          user && sendTyping(user.id, user.user_metadata?.username ?? "Someone")
        }
      />
    </div>
  );
}