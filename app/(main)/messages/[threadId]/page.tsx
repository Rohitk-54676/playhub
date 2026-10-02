"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChatWindow } from "@/components/chat/ChatWindow";

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

export default function ConversationPage() {
  const params = useParams<{ threadId: string }>();
  const threadId = params.threadId;

  const [conversation, setConversation] = useState<ConversationInfo | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/conversations/${threadId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Failed to load");
        } else {
          setConversation(await res.json());
        }
      } catch {
        setError("Network error");
      }
      setLoading(false);
    }
    load();
  }, [threadId]);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{error ?? "Not found."}</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl border bg-card md:h-[calc(100vh-5rem)]">
      <ChatWindow conversation={conversation} />
    </div>
  );
}