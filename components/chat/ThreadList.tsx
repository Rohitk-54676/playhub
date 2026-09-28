"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users } from "lucide-react";
import { UserAvatar } from "@/components/social/UserAvatar";
import { cn } from "@/lib/utils";

export interface Thread {
  id: string;
  type: string;
  name: string | null;
  avatar_url: string | null;
  other_user_id: string | null;
  member_count: number;
  last_message: {
    body: string;
    sender_name: string;
    created_at: string;
  } | null;
  unread_count: number;
  updated_at: string;
}

interface Props {
  threads: Thread[];
  loading?: boolean;
}

export function ThreadList({ threads, loading }: Props) {
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No conversations yet. Message a friend from their profile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {threads.map((t) => {
        const href = `/messages/${t.id}`;
        const active = pathname === href;

        return (
          <Link
            key={t.id}
            href={href}
            className={cn(
              "flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50",
              active && "bg-accent/10"
            )}
          >
            {t.type === "direct" ? (
              <UserAvatar
                username={t.name ?? "?"}
                displayName={t.name}
                avatarUrl={t.avatar_url}
                size="md"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-fg">
                <Users className="h-5 w-5" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {t.name ?? "Conversation"}
                </span>
                {t.last_message && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(t.last_message.created_at).toLocaleDateString(
                      [],
                      { month: "short", day: "numeric" }
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-muted-foreground">
                  {t.last_message
                    ? `${t.last_message.sender_name}: ${t.last_message.body}`
                    : "No messages yet"}
                </span>
                {t.unread_count > 0 && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-fg">
                    {t.unread_count > 9 ? "9+" : t.unread_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}