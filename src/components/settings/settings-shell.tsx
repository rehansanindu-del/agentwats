"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SkeletonText } from "@/components/ui/skeleton";
import { useTrial } from "@/hooks/useTrial";
import { createClient } from "@/lib/supabase/client";
import { asStringArray } from "@/lib/lead-fields";

interface BotRow {
  prompt: string;
  is_active: boolean;
}

export function SettingsShell() {
  const trial = useTrial();
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [maskedToken, setMaskedToken] = useState<string | null>(null);
  const [editingToken, setEditingToken] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loadingConnection, setLoadingConnection] = useState(true);
  const [savingWa, setSavingWa] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [aiOn, setAiOn] = useState(true);
  const [loadingBot, setLoadingBot] = useState(true);
  const [savingBot, setSavingBot] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [step, setStep] = useState(1);

  const [leadFields, setLeadFields] = useState<string[]>([]);
  const [displayFields, setDisplayFields] = useState<string[]>([]);
  const [loadingLeadDisplay, setLoadingLeadDisplay] = useState(true);
  const [savingLeadDisplay, setSavingLeadDisplay] = useState(false);

  const loadLeadDisplaySettings = useCallback(async () => {
    setLoadingLeadDisplay(true);
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setLeadFields([]);
        setDisplayFields([]);
        return;
      }

      const { data: user, error } = await supabase
        .from("users")
        .select("lead_fields, lead_display_fields")
        .eq("id", authUser.id)
        .single();

      if (error) {
        throw error;
      }

      const lf = asStringArray(user?.lead_fields);
      setLeadFields(lf);

      const dfRaw = user?.lead_display_fields;
      if (dfRaw === null || dfRaw === undefined) {
        setDisplayFields([...lf]);
      } else {
        setDisplayFields(asStringArray(dfRaw));
      }
    } catch (e) {
      console.error("loadLeadDisplaySettings", e);
      toast.error(e instanceof Error ? e.message : "Failed to load lead display settings");
    } finally {
      setLoadingLeadDisplay(false);
    }
  }, []);

  useEffect(() => {
    void loadLeadDisplaySettings();
  }, [loadLeadDisplaySettings]);

  const handleSaveLeadDisplay = async () => {
    setSavingLeadDisplay(true);
    try {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error("Not signed in");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          lead_display_fields: displayFields,
        })
        .eq("id", authUser.id);

      if (error) {
        console.error("Error saving display fields:", error);
        toast.error(error.message);
      } else {
        console.log("Saved display fields:", displayFields);
        toast.success("Lead display preferences saved");
      }
    } catch (e) {
      console.error("Error saving display fields:", e);
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingLeadDisplay(false);
    }
  };

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

  const loadConnection = useCallback(async () => {
    setLoadingConnection(true);
    try {
      const res = await fetch("/api/whatsapp/connect", { cache: "no-store" });
      const json = (await res.json()) as {
        connected?: boolean;
        account?: {
          phone_number_id?: string;
          business_account_id?: string | null;
          masked_access_token?: string | null;
        } | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load WhatsApp connection");
      }

      const account = json.account;
      setConnected(Boolean(json.connected));
      setPhoneNumberId(account?.phone_number_id ?? "");
      setBusinessAccountId(account?.business_account_id ?? "");
      setMaskedToken(account?.masked_access_token ?? null);
      setEditingToken(!json.connected);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load connection");
    } finally {
      setLoadingConnection(false);
    }
  }, []);

  useEffect(() => {
    void loadConnection();
  }, [loadConnection]);

  async function handleSave() {
    setSavingWa(true);
    try {
      const tokenToSend = editingToken ? accessToken.trim() : undefined;
      if (editingToken && !tokenToSend) {
        toast.error("Access token is required while editing.");
        return;
      }
      if (!phoneNumberId.trim()) {
        toast.error("Phone Number ID is required.");
        return;
      }
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: tokenToSend,
          phone_number_id: phoneNumberId.trim(),
          business_account_id: businessAccountId.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Save failed");
      }
      toast.success("WhatsApp credentials saved");
      setStep(2);
      setConnected(true);
      setAccessToken("");
      await loadConnection();
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
      const res = await fetch("/api/whatsapp/connect", { cache: "no-store" });
      const json = (await res.json()) as { connected?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Connection check failed");
      if (!json.connected) throw new Error("WhatsApp is not connected yet");
      toast.success("WhatsApp connection looks good.");
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
    <div className="p-6 opacity-100 transition-opacity duration-300 md:p-8">
      <div className="mx-auto max-w-3xl space-y-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            Customize your AI assistant ⚙️
            <br />
            Connect, configure, and scale your automation.
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Setup progress: step {step} of 3</p>
        </div>

        <section className="card-premium p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">1. Connect WhatsApp Cloud API</h2>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${connected ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
              {connected ? "Connected ✅" : "Not connected"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Paste a long-lived access token and your Phone number ID from Meta Business. Configure the
            webhook URL to{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
              /api/webhook/whatsapp
            </code>{" "}
            with your verify token from{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">WHATSAPP_VERIFY_TOKEN</code>.
          </p>
          {loadingConnection ? (
            <div className="mt-6 space-y-2">
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : (
          <form className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Access token</label>
              {editingToken ? (
                <input
                  type="password"
                  autoComplete="off"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAG…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={maskedToken ?? "Not set"}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingToken(true)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-50"
                  >
                    Edit
                  </button>
                </div>
              )}
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
              disabled={savingWa || !phoneNumberId.trim() || (editingToken && !accessToken.trim())}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:scale-[1.02] hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingWa ? "Saving…" : "Save connection"}
            </button>
            <button type="button" onClick={() => void testConnection()} className="ml-2 rounded-xl border border-slate-200 px-4 py-2 text-sm transition-all duration-200 hover:scale-[1.02] hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              {testing ? "Testing..." : "Test connection"}
            </button>
          </form>
          )}
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
                disabled={!trial.loading && !trial.isActive}
                onClick={() => setAiOn((v) => !v)}
                className={`relative h-8 w-14 rounded-full transition ${
                  aiOn ? "bg-emerald-600" : "bg-slate-300"
                } disabled:cursor-not-allowed disabled:opacity-50`}
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
            <div className="mt-6 space-y-3">
              <SkeletonText className="h-4 w-40" />
              <SkeletonText className="h-32 w-full rounded-lg" />
              <SkeletonText className="h-10 w-36 rounded-lg" />
            </div>
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

        <section className="card-premium p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Lead Display Settings</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Choose which fields appear in your Leads table.
          </p>

          {loadingLeadDisplay ? (
            <div className="mt-6 space-y-2">
              <SkeletonText className="h-4 w-48" />
              <SkeletonText className="h-4 w-56" />
              <SkeletonText className="h-4 w-40" />
            </div>
          ) : leadFields.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">No fields available. Add fields first.</p>
          ) : (
            <>
              <div className="mt-4 space-y-2">
                {leadFields.map((field) => (
                  <label
                    key={field}
                    className="flex cursor-pointer items-center gap-2 rounded-lg py-0.5 sm:py-1"
                  >
                    <input
                      type="checkbox"
                      checked={displayFields.includes(field)}
                      onChange={() => {
                        if (displayFields.includes(field)) {
                          setDisplayFields(displayFields.filter((f) => f !== field));
                        } else {
                          setDisplayFields([...displayFields, field]);
                        }
                      }}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{field}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void handleSaveLeadDisplay()}
                disabled={savingLeadDisplay}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:hover:bg-emerald-500"
              >
                {savingLeadDisplay ? "Saving..." : "Save preferences"}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
