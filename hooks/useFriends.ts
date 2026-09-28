"use client";

import { useCallback, useEffect, useState } from "react";
import { getFriends, getPendingRequests } from "@/lib/social/friends";
import type { Friend, FriendRequest } from "@/lib/types";

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [f, p] = await Promise.all([getFriends(), getPendingRequests()]);
    setFriends(f);
    setPending(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { friends, pending, loading, refresh };
}