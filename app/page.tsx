"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { MessagesProvider, useMessages } from "@/components/messages-provider";
import { AppHeader } from "@/components/app-header";
import { SyncComposer } from "@/components/sync-composer";
import { MessageTimeline } from "@/components/message-timeline";

function AppContent() {
  const { state } = useMessages();

  if (!state.user || !state.isInitialized) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-zinc-300 dark:selection:bg-zinc-700 min-h-screen flex flex-col items-center">
      <main className="w-full max-w-2xl px-4 md:px-8 flex flex-col flex-1 overflow-hidden relative">
        <AppHeader />
        <SyncComposer />
        <MessageTimeline />
      </main>
    </div>
  );
}

export default function LinkSyncApp() {
  return (
    <Suspense
      fallback={
        <div className="bg-zinc-50 dark:bg-zinc-950 min-h-screen flex flex-col items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <MessagesProvider>
        <AppContent />
      </MessagesProvider>
    </Suspense>
  );
}
