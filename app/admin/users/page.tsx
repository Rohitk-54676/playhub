"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Loader2,
  Shield,
  ShieldOff,
  Ban,
  UserCheck,
  Trash2,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/social/UserAvatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_guest: boolean;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  last_seen_at: string | null;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "registered", label: "Registered" },
  { id: "guests", label: "Guests" },
  { id: "admins", label: "Admins" },
  { id: "banned", label: "Banned" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        page: String(page),
        filter,
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) {
        setUsers([]);
      } else {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
        setPageCount(data.pageCount);
      }
    } catch {
      setUsers([]);
    }
    setLoading(false);
  }, [q, page, filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(
    userId: string,
    action: "ban" | "unban" | "promote" | "demote" | "delete",
    confirmMsg?: string
  ) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setActing(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Action failed");
        setActing(null);
        return;
      }
      toast.success("Done");
      await load();
    } catch {
      toast.error("Network error");
    }
    setActing(null);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          {total} total · manage accounts and permissions
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by username or name…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f.id
                  ? "border-accent bg-accent/10 text-accent"
                  : "hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div
              key={u.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3",
                u.is_banned && "border-red-500/30 bg-red-500/5"
              )}
            >
              <UserAvatar
                username={u.username}
                displayName={u.display_name}
                avatarUrl={u.avatar_url}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">
                    {u.display_name ?? u.username}
                  </p>
                  {u.is_admin && (
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  {u.is_guest && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                      Guest
                    </span>
                  )}
                  {u.is_banned && (
                    <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-red-500">
                      Banned
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  @{u.username} · joined{" "}
                  {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-1">
                {u.is_banned ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => act(u.id, "unban")}
                    disabled={acting === u.id}
                  >
                    <UserCheck className="mr-1 h-3.5 w-3.5" />
                    Unban
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      act(
                        u.id,
                        "ban",
                        `Ban @${u.username}? They won't be able to use PlayHub.`
                      )
                    }
                    disabled={acting === u.id}
                  >
                    <Ban className="mr-1 h-3.5 w-3.5" />
                    Ban
                  </Button>
                )}

                {u.is_admin ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => act(u.id, "demote")}
                    disabled={acting === u.id}
                  >
                    <ShieldOff className="mr-1 h-3.5 w-3.5" />
                    Demote
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => act(u.id, "promote")}
                    disabled={acting === u.id}
                  >
                    <Shield className="mr-1 h-3.5 w-3.5" />
                    Promote
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:bg-red-500/10"
                  onClick={() =>
                    act(
                      u.id,
                      "delete",
                      `Delete @${u.username}? This cannot be undone.`
                    )
                  }
                  disabled={acting === u.id}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}