"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { useUser } from "./useUser";

export function useProfile() {
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    fetch(`/api/profile?id=${user.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((p) => {
        setProfile(p);
        setLoading(false);
      });
  }, [user, userLoading]);

  return { profile, loading, user };
}