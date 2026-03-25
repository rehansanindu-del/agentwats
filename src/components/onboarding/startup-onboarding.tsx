"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface BotResponse {
  bot?: { is_active: boolean };
}

export function StartupOnboarding() {
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [checkingAi, setCheckingAi] = useState(true);

  useEffect(() => {
    const key = window.localStorage.getItem("agentwats-onboarding-dismissed");
    if (!key) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/bots");
        if (!res.ok) return;
        const json = (await res.json()) as BotResponse;
        setAiEnabled(Boolean(json.bot?.is_active));
      } finally {
        setCheckingAi(false);
      }
    })();
  }, []);

  const progress = useMemo(() => {
    let score = 0;
    if (testing) score += 1;
    if (aiEnabled) score += 1;
    return Math.min(3, score + 1);
  }, [testing, aiEnabled]);

  async function runConnectionTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Health check failed");
      toast.success("Connection test passed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
      setTesting(false);
    }
  }

  async function enableAi() {
    try {
      const res = await fetch("/api/bots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      if (!res.ok) throw new Error("Failed to enable AI");
      setAiEnabled(true);
      toast.success("Your AI is now live!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to enable AI");
    }
  }

  function dismiss() {
    setOpen(false);
    window.localStorage.setItem("agentwats-onboarding-dismissed", "1");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Get started in 2 minutes
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Complete setup and launch your WhatsApp AI assistant.
        </p>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300" style={{ width: `${(progress / 3) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Progress: {progress}/3</p>

        <ol className="mt-4 space-y-3 text-sm">
          <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span>1. Connect WhatsApp</span>
              <Link href="/settings" className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium dark:bg-slate-800">Open Settings</Link>
            </div>
          </li>
          <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span>2. Test connection</span>
              <button onClick={() => void runConnectionTest()} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700">
                {testing ? "Passed" : "Run test"}
              </button>
            </div>
          </li>
          <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span>3. Enable AI automation</span>
              <button onClick={() => void enableAi()} className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900">
                {checkingAi ? "Checking..." : aiEnabled ? "Enabled" : "Enable AI"}
              </button>
            </div>
          </li>
        </ol>

        {aiEnabled ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
            Your AI is now live!
          </div>
        ) : null}

        <div className="mt-5 flex justify-end">
          <button onClick={dismiss} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900">
            Continue to app
          </button>
        </div>
      </div>
    </div>
  );
}
