"use client";

import { use, useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { fetchProfileByUsername } from "@/lib/social/profile";
import type { Profile } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/social/UserAvatar";
import { FriendButton } from "@/components/social/FriendButton";
import { useUser } from "@/hooks/useUser";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user } = useUser();
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

  const isMe = user?.id === profile.id;
  const name = profile.display_name ?? profile.username;

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar
              username={profile.username}
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              size="xl"
            />
            <div>
              <h1 className="text-2xl font-bold">{name}</h1>
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

          {!isMe && (
            <div className="flex gap-2">
              <FriendButton targetId={profile.id} />
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Users className="h-5 w-5" />
          <p className="text-sm">
            Match history, stats, and more coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
}