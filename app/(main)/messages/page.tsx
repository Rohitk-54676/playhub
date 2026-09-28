"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { ThreadList, type Thread } from "@/components/chat/ThreadList";

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          setThreads(data);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Chat with your friends.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-card">
          <ThreadList threads={[]} loading />
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-semibold">No conversations yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Go to <span className="text-accent">Friends</span> and start a chat
            with someone.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <ThreadList threads={threads} />
        </div>
      )}
    </div>
  );
}