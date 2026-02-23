"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/components/messages-provider";

export function SyncComposer() {
  const { state, actions } = useMessages();
  const [inputValue, setInputValue] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || state.isLoading) return;

    await actions.submit(inputValue);
    // Realtime subscription handles state update; just clear input
    setInputValue("");
  };

  return (
    <div className="mb-6 shrink-0">
      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border shadow-lg shadow-zinc-200/50 dark:shadow-black/50 ring-1 ring-zinc-900/5"
      >
        <Input
          name="message"
          placeholder="Paste a link or type a message…"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 flex-1 h-12 text-base bg-transparent p-3"
          disabled={state.isLoading}
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={!inputValue.trim() || state.isLoading}
          className="h-12 w-12 rounded-xl shrink-0"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}
