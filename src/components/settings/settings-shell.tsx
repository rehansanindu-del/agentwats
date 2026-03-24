"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface BotRow {
  prompt: string;
  is_active: boolean;
}

export function SettingsShell() {
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [savingWa, setSavingWa] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [aiOn, setAiOn] = useState(true);
  const [loadingBot, setLoadingBot] = useState(true);
  const [savingBot, setSavingBot] = useState(false);

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

  async function saveWhatsapp(e: React.FormEvent) {
    e.preventDefault();
    setSavingWa(true);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken.trim(),
          phone_number_id: phoneNumberId.trim(),
          business_account_id: businessAccountId.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Save failed");
      }
      toast.success("WhatsApp credentials saved");
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingBot(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Connect WhatsApp and tune your AI assistant.</p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">WhatsApp Cloud API</h2>
          <p className="mt-1 text-sm text-slate-500">
            Paste a long-lived access token and your Phone number ID from Meta Business. Configure the
            webhook URL to{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
              /api/webhook/whatsapp
            </code>{" "}
            with your verify token from{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">WHATSAPP_VERIFY_TOKEN</code>.
          </p>
          <form onSubmit={saveWhatsapp} className="mt-6 space-y-4">
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
              type="submit"
              disabled={savingWa || !accessToken.trim() || !phoneNumberId.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingWa ? "Saving…" : "Save connection"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">AI assistant</h2>
              <p className="mt-1 text-sm text-slate-500">
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
        </section>
      </div>
    </div>
  );
}
