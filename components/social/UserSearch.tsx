"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FriendButton } from "./FriendButton";
import { ProfilePopover } from "./ProfilePopover";
import { searchUsers } from "@/lib/social/friends";

interface Result {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const handle = setTimeout(async () => {
      const data = await searchUsers(query);
      setResults(data);
      setLoading(false);
    }, 250);

    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username…"
          className="pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <ProfilePopover
                userId={u.id}
                username={u.username}
                displayName={u.display_name}
                avatarUrl={u.avatar_url}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${u.username}`}
                  className="block truncate font-medium hover:underline"
                >
                  {u.display_name ?? u.username}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  @{u.username}
                </p>
              </div>
              <FriendButton targetId={u.id} size="sm" />
            </div>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && !loading && results.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No users found.
        </p>
      )}
    </div>
  );
}