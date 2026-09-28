"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Check, X } from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { respondToRequest } from "@/lib/social/friends";
import type { FriendRequest } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  request: FriendRequest;
  onResponded: () => void;
}

export function FriendRequestCard({ request, onResponded }: Props) {
  const [acting, setActing] = useState<"accept" | "decline" | null>(null);

  async function handle(action: "accept" | "decline") {
    setActing(action);
    const { error } = await respondToRequest(request.id, action);
    setActing(null);

    if (error) {
      toast.error(error);
      return;
    }
    toast.success(action === "accept" ? "Friend added" : "Request declined");
    onResponded();
  }

  const name = request.requester.display_name ?? request.requester.username;

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <Link href={`/profile/${request.requester.username}`}>
        <UserAvatar
          username={request.requester.username}
          displayName={request.requester.display_name}
          avatarUrl={request.requester.avatar_url}
          size="md"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${request.requester.username}`}
          className="block truncate font-medium hover:underline"
        >
          {name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          @{request.requester.username}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handle("decline")}
          disabled={acting !== null}
        >
          {acting === "decline" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          onClick={() => handle("accept")}
          disabled={acting !== null}
        >
          {acting === "accept" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}