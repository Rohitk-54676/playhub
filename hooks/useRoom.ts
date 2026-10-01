"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RoomPlayer {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_host: boolean;
    joined_at: string;
}

export interface RoomData {
    id: string;
    code: string;
    gameId: string;
    hostId: string;
    status: "lobby" | "playing" | "finished";
    state: unknown;
    host: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
    };
    players: RoomPlayer[];
    am_i_host: boolean;
    am_i_member: boolean;
}

export function useRoom(code: string | null) {
    const router = useRouter();
    const [room, setRoom] = useState<RoomData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    // Load room data
    const refresh = useCallback(async () => {
        if (!code) return;
        try {
            const res = await fetch(`/api/rooms/${code}`);
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? "Room not found");
                setLoading(false);
                return;
            }
            const data = await res.json();
            setRoom(data);
            setError(null);
        } catch {
            setError("Network error");
        }
        setLoading(false);
    }, [code]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Subscribe to realtime room channel
    useEffect(() => {
        if (!code) return;

        const supabase = createClient();
        const channel = supabase
            .channel(`room:${code.toUpperCase()}`)
            .on("broadcast", { event: "player_joined" }, () => {
                refresh();
            })
            .on("broadcast", { event: "player_left" }, () => {
                refresh();
            })
            .on("broadcast", { event: "room_updated" }, () => {
                refresh();
            })
            .on("broadcast", { event: "game_started" }, () => {
                refresh();
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            channel.unsubscribe();
            channelRef.current = null;
        };
    }, [code, refresh]);

    // Broadcast helper
    const broadcast = useCallback(
        async (event: string, payload: Record<string, unknown> = {}) => {
            if (channelRef.current) {
                await channelRef.current.send({
                    type: "broadcast",
                    event,
                    payload,
                });
            }
        },
        []
    );

    // Join the room (if not a member)
    const join = useCallback(async () => {
        if (!code) return { error: "No code" };
        try {
            const res = await fetch(`/api/rooms/${code}/join`, { method: "POST" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                return { error: data.error ?? "Failed to join" };
            }
            await broadcast("player_joined");
            await refresh();
            return { error: null };
        } catch {
            return { error: "Network error" };
        }
    }, [code, broadcast, refresh]);

    // Leave and navigate away
    const leave = useCallback(async () => {
        if (!code) return;
        try {
            await fetch(`/api/rooms/${code}/leave`, { method: "POST" });
            // Tell everyone the room changed (host may have shifted)
            await broadcast("room_updated");
            await broadcast("player_left");
        } catch {
            // ignore
        }
        router.push("/play/bingo");
    }, [code, broadcast, router]);

    // Start the game (host only)
    const start = useCallback(async () => {
        if (!code) return { error: "No code" };
        try {
            const res = await fetch(`/api/rooms/${code}/start`, { method: "POST" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                return { error: data.error ?? "Failed to start" };
            }
            await broadcast("game_started");
            await refresh();
            return { error: null };
        } catch {
            return { error: "Network error" };
        }
    }, [code, broadcast, refresh]);

    return { room, loading, error, refresh, join, leave, start, broadcast };
}