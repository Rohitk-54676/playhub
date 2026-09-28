"use client";

import { useCallback, useEffect, useState } from "react";
import { getFriendStatus, sendFriendRequest } from "@/lib/social/friends";
import type { FriendStatus } from "@/lib/types";

export function useFriendStatus(targetId: string | null) {
  const [status, setStatus] = useState<FriendStatus>("none");
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);

  const refresh = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    const s = await getFriendStatus(targetId);
    setStatus(s);
    setLoading(false);
  }, [targetId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendRequest = useCallback(async () => {
    if (!targetId) return { error: "No target" };
    setActing(true);
    const result = await sendFriendRequest(targetId);
    setActing(false);
    if (!result.error) await refresh();
    return result;
  }, [targetId, refresh]);

  return { status, loading, acting, sendRequest, refresh };
}