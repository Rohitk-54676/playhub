"use client";

import { useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  code: string;
  gameId: string;
}

export function InvitePanel({ code, gameId }: Props) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

    const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/play/${gameId}/room/${code}`
      : "";

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast.success("Code copied");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast.success("Link copied");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Room code
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-2xl font-bold tracking-widest">
            {code}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={copyCode}
            className="h-8 w-8 p-0"
          >
            {copiedCode ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Invite link
        </p>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex-1 truncate rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">
            {url}
          </div>
          <Button size="sm" variant="outline" onClick={copyLink}>
            {copiedLink ? (
              <>
                <Check className="mr-1.5 h-4 w-4 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Link2 className="mr-1.5 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}