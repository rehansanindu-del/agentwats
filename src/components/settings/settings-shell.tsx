"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

interface BotRow {
  prompt: string;
  is_active: boolean;
}

export function SettingsShell() {
  const supabase = createSupabaseClient();
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [savingWa, setSavingWa] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [aiOn, setAiOn] = useState(true);
  const [loadingBot, setLoadingBot] = useState(true);
  const [savingBot, setSavingBot] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [step, setStep] = useState(1);

  const loadBot = useCallback(async () => {
    setLoadingBot(true);
    try {
      const res = await fetch("/api/bots");
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed to load AI settings");
      }
      const json = (await res.json()) as { bot: BotRow };
      setPrompt(json.bot.prompt);
      setAiOn(json.bot.is_active);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingBot(false);
    }
  }, []);

  useEffect(() => {
    void loadBot();
  }, [loadBot]);

  useEffect(() => {
    void (async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);
    })();
  }, [supabase]);

  async function handleSave() {
    setSavingWa(true);
    try {
      if (!user) {
        window.alert("You must be logged in to save WhatsApp settings.");
        toast.error("You must be logged in.");
        return;
      }

      const payload = {
        userId: user.id,
        phoneNumberId: phoneNumberId.trim(),
        accessToken: accessToken.trim(),
      };

      if (!payload.phoneNumberId || !payload.accessToken) {
        window.alert("Phone Number ID and Access Token are required.");
        toast.error("Phone Number ID and Access Token are required.");
        return;
      }

      // Temporary debug log for production verification
      console.log(payload);

      const res = await fetch("/api/save-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        window.alert(json.error ?? "Save failed");
        throw new Error(json.error ?? "Save failed");
      }
      window.alert("WhatsApp connection saved successfully.");
      toast.success("WhatsApp credentials saved");
      setStep(2);
      setAccessToken("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingWa(false);
    }
  }

  async function saveBot(e: React.FormEvent) {
    e.preventDefault();
    setSavingBot(true);
    try {
      const res = await fetch("/api/bots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          is_active: aiOn,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Save failed");
      }
      toast.success("AI settings saved");
      if (aiOn) {
        setStep(3);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingBot(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("API not reachable");
      toast.success("API is reachable. Connection baseline passed.");
      setStep(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  async function sendTestMessage() {
    if (!testPhone.trim()) {
      toast.error("Enter a test phone number");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/whatsapp/test-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testPhone.trim(), text: "AgentWats test message ✅" }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Test message failed");
      toast.success("Test message sent successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage WhatsApp Cloud API and AI assistant behavior.</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Setup progress: step {step} of 3</p>
        </div>

        <section className="card-premium p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">1. Connect WhatsApp Cloud API</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Paste a long-lived access token and your Phone number ID from Meta Business. Configure the
            webhook URL to{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
              /api/webhook/whatsapp
            </code>{" "}
            with your verify token from{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">WHATSAPP_VERIFY_TOKEN</code>.
          </p>
          <form className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Access token</label>
              <input
                type="password"
                autoComplete="off"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAG…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Phone number ID</label>
              <input
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="123456789012345"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                WhatsApp Business Account ID (optional)
              </label>
              <input
                value={businessAccountId}
                onChange={(e) => setBusinessAccountId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={savingWa || !accessToken.trim() || !phoneNumberId.trim() || !user}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:scale-[1.02] hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingWa ? "Saving…" : "Save connection"}
            </button>
            <button type="button" onClick={() => void testConnection()} className="ml-2 rounded-xl border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              {testing ? "Testing..." : "Test connection"}
            </button>
          </form>
          <div className="mt-4 flex gap-2">
            <input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="Recipient phone for test" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
            <button type="button" onClick={() => void sendTestMessage()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white dark:bg-slate-700">
              Send test message
            </button>
          </div>
        </section>

        <section className="card-premium p-6">
          <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">2. Test connection and enable AI</h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">AI assistant</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                When AI is on, inbound WhatsApp messages receive an automatic reply. Sending a manual
                message from Conversations turns AI off until you enable it again.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span className="text-sm font-medium text-slate-800">{aiOn ? "AI ON" : "AI OFF"}</span>
              <button
                type="button"
                onClick={() => setAiOn((v) => !v)}
                className={`relative h-8 w-14 rounded-full transition ${
                  aiOn ? "bg-emerald-600" : "bg-slate-300"
                }`}
                aria-pressed={aiOn}
              >
                <span
                  className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    aiOn ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {loadingBot ? (
            <div className="mt-6 text-sm text-slate-500">Loading…</div>
          ) : (
            <form onSubmit={saveBot} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">System prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm outline-none ring-emerald-500/20 focus:ring-2"
                />
              </div>
              <button
                type="submit"
                disabled={savingBot || !prompt.trim()}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {savingBot ? "Saving…" : "Save AI settings"}
              </button>
            </form>
          )}
          {step >= 3 ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
              Your onboarding is complete. AI automation is ready.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
