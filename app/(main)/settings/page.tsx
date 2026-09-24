"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { updateProfile } from "@/lib/social/profile";
import { AccentPicker } from "@/components/theme/AccentPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, loading, user } = useProfile();
  const { theme, setTheme } = useTheme();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setDisplayName(profile.display_name ?? "");
    }
  }, [profile]);

async function handleSave() {
  if (!user) return;
  setSaving(true);

  const cleanUsername = username.toLowerCase().trim();
  const cleanDisplayName = displayName.trim();

  const { error, profile: updated } = await updateProfile(user.id, {
    username: cleanUsername,
    display_name: cleanDisplayName,
  });

  setSaving(false);

  if (error) {
    toast.error(error);
    return;
  }

  // Update local state instantly so UI reflects changes
  if (updated) {
    setUsername(updated.username);
    setDisplayName(updated.display_name ?? "");
  }

  toast.success("Profile updated");
}

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/auth/login");
    router.refresh();
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
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">
          You need an account to access settings.
        </p>
        <Button onClick={() => router.push("/auth/login")}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and preferences
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
            <p className="text-xs text-muted-foreground">
              3–20 chars, lowercase letters, numbers, underscore.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-fit">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5">
          <div className="flex flex-col gap-2">
            <Label>Accent color</Label>
            <AccentPicker />
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {["light", "dark", "system"].map((t) => (
                <Button
                  key={t}
                  variant={theme === t ? "default" : "outline"}
                  onClick={() => setTheme(t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="rounded-2xl border bg-card p-5">
          <Button variant="outline" onClick={handleLogout} className="w-fit">
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}