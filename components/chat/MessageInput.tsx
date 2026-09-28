"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onSend: (body: string) => Promise<{ error: string | null }>;
  onTyping?: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, disabled }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setText("");
    const { error } = await onSend(body);
    setSending(false);

    if (error) {
      setText(body); // restore on failure
    } else {
      inputRef.current?.focus();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    if (e.target.value.trim().length > 0) {
      onTyping?.();
    }
  }

  return (
    <form
      onSubmit={handleSend}
      className="flex items-center gap-2 border-t bg-card p-3"
    >
      <Input
        ref={inputRef}
        value={text}
        onChange={handleChange}
        placeholder="Type a message…"
        disabled={disabled || sending}
        maxLength={2000}
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!text.trim() || sending || disabled}
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}