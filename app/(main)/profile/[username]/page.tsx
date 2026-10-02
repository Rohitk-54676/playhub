"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Users, MessageCircle } from "lucide-react";
import { fetchProfileByUsername } from "@/lib/social/profile";
import type { Profile } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/social/UserAvatar";
import { FriendButton } from "@/components/social/FriendButton";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;

  const router = useRouter();
  const { user } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    fetchProfileByUsername(username).then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [username]);

  async function openChat() {
    if (!profile) return;
    setOpening(true);
    try {
      const res = await fetch("/api/dm/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: profile.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to open chat");
        setOpening(false);
        return;
      }
      const data = await res.json();
      router.push(`/messages/${data.id}`);
    } catch {
      toast.error("Network error");
      setOpening(false);
    }
  }

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
              <Button variant="outline" onClick={openChat} disabled={opening}>
                {opening ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                )}
                Message
              </Button>
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