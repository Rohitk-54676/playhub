"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchProfileByUsername } from "@/lib/social/profile";
import type { Profile } from "@/lib/types";
import { Card } from "@/components/ui/card";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileByUsername(username).then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [username]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-fg">
            {(profile.display_name ?? profile.username)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {profile.display_name ?? profile.username}
            </h1>
            <p className="text-sm text-muted-foreground">
              @{profile.username}
            </p>
            {profile.is_guest && (
              <p className="mt-1 text-xs text-muted-foreground">
                Guest account
              </p>
            )}
          </div>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        Friend system coming in Module 3.
      </p>
    </div>
  );
}