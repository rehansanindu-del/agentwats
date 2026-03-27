import { Suspense } from "react";
import { ConversationsShell } from "@/components/conversations/conversations-shell";

export default function ConversationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center p-8 text-sm text-slate-500 dark:text-slate-400">
          Loading conversations…
        </div>
      }
    >
      <ConversationsShell />
    </Suspense>
  );
}
