import { createClient } from "@/lib/supabase/server";

/**
 * Broadcast a message event to a conversation channel.
 * Called from API routes after inserting a message.
 */
export async function broadcastMessage(
  conversationId: string,
  payload: {
    id: string;
    body: string;
    created_at: string;
    sender: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  }
) {
  const supabase = await createClient();
  const channel = supabase.channel(`conversation:${conversationId}`);

  await channel.send({
    type: "broadcast",
    event: "new_message",
    payload,
  });
}

/**
 * Broadcast a typing event to a conversation channel.
 */
export async function broadcastTyping(
  conversationId: string,
  userId: string,
  username: string
) {
  const supabase = await createClient();
  const channel = supabase.channel(`conversation:${conversationId}`);

  await channel.send({
    type: "broadcast",
    event: "typing",
    payload: { userId, username, at: Date.now() },
  });
}