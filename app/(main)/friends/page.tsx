"use client";

import { Loader2, Users } from "lucide-react";
import { useFriends } from "@/hooks/useFriends";
import { UserSearch } from "@/components/social/UserSearch";
import { FriendList } from "@/components/social/FriendList";
import { FriendRequestCard } from "@/components/social/FriendRequestCard";

export default function FriendsPage() {
  const { friends, pending, loading, refresh } = useFriends();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
        <p className="text-muted-foreground">
          Find people, add friends, and hang out.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Find people</h2>
        <UserSearch />
      </section>

      {pending.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">
            Friend requests{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({pending.length})
            </span>
          </h2>
          <div className="flex flex-col gap-2">
            {pending.map((req) => (
              <FriendRequestCard
                key={req.id}
                request={req}
                onResponded={refresh}
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          Your friends{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({friends.length})
          </span>
        </h2>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : friends.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold">No friends yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Search for someone by username above to send them a friend
              request.
            </p>
          </div>
        ) : (
          <FriendList friends={friends} />
        )}
      </section>
    </div>
  );
}