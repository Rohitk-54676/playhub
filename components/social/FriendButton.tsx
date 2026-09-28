"use client";

import { Loader2, UserPlus, Clock, Check, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFriendStatus } from "@/hooks/useFriendStatus";
import { toast } from "sonner";

interface FriendButtonProps {
  targetId: string;
  onChanged?: () => void;
  size?: "sm" | "default" | "lg";
}

export function FriendButton({
  targetId,
  onChanged,
  size = "default",
}: FriendButtonProps) {
  const { status, loading, acting, sendRequest } = useFriendStatus(targetId);

  async function handleClick() {
    if (status !== "none") return;

    const { error } = await sendRequest();
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Friend request sent");
    onChanged?.();
  }

  if (loading) {
    return (
      <Button variant="outline" size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (status === "friends") {
    return (
      <Button variant="outline" size={size} disabled>
        <Check className="mr-1.5 h-4 w-4" />
        Friends
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <Button variant="outline" size={size} disabled>
        <Clock className="mr-1.5 h-4 w-4" />
        Requested
      </Button>
    );
  }

  if (status === "pending_received") {
    return (
      <Button variant="outline" size={size} disabled>
        <Clock className="mr-1.5 h-4 w-4" />
        Respond in Friends
      </Button>
    );
  }

  if (status === "blocked" || status === "blocked_by_them") {
    return (
      <Button variant="outline" size={size} disabled>
        <Ban className="mr-1.5 h-4 w-4" />
        Blocked
      </Button>
    );
  }

  return (
    <Button onClick={handleClick} disabled={acting} size={size}>
      {acting ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="mr-1.5 h-4 w-4" />
      )}
      Add Friend
    </Button>
  );
}