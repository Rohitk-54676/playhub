"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: string;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

const TYPES = [
  { id: "info", label: "Info", color: "text-accent" },
  { id: "warning", label: "Warning", color: "text-amber-500" },
  { id: "success", label: "Success", color: "text-green-500" },
];

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        setItems(await res.json());
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and body required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, type, active: true }),
      });
      if (!res.ok) {
        toast.error("Failed to create");
        setCreating(false);
        return;
      }
      toast.success("Announcement published");
      setTitle("");
      setBody("");
      setType("info");
      setShowForm(false);
      await load();
    } catch {
      toast.error("Network error");
    }
    setCreating(false);
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) {
        toast.error("Failed to update");
        return;
      }
      await load();
    } catch {
      toast.error("Network error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed to delete");
        return;
      }
      toast.success("Deleted");
      await load();
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 md:px-8 md:py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Broadcast messages to all users
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4 rounded-2xl border bg-card p-5"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New game launching Friday!"
              maxLength={100}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="body">Body</Label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Tic Tac Toe is coming this Friday. Stay tuned!"
              maxLength={300}
              rows={3}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    type === t.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "hover:bg-muted"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={creating} className="w-fit">
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Megaphone className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>
        </form>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No announcements yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border bg-card p-4",
                !a.active && "opacity-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{a.title}</p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide",
                        a.type === "warning"
                          ? "bg-amber-500/10 text-amber-500"
                          : a.type === "success"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-accent/10 text-accent"
                      )}
                    >
                      {a.type}
                    </span>
                    {!a.active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {a.body}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Created {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(a.id, !a.active)}
                  >
                    {a.active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:bg-red-500/10"
                    onClick={() => handleDelete(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}