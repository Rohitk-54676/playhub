export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  accent: string;
  is_guest: boolean;
  is_admin: boolean;
  is_banned: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export type FriendStatus =
  | "none"            // no relationship
  | "pending_sent"    // I sent request
  | "pending_received" // They sent me request
  | "friends"
  | "blocked"         // I blocked them
  | "blocked_by_them"; // They blocked me

export interface FriendRequest {
  id: string;
  requester: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  createdAt: string;
}

export interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  friendshipId: string;
}

export interface NotificationItem {
  id: string;
  type: "friend_request" | "friend_accepted" | "room_invite";
  actor: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  data?: {
    roomCode?: string;
    roomId?: string;
    gameId?: string;
    invitedByName?: string;
  };
  read: boolean;
  createdAt: string;
}