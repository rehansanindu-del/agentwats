"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Contact, Message } from "@/lib/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const POLL_MS = 8000;

export function ConversationsShell() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  /** Ref avoids stale closures in Realtime handlers */
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const selected = useMemo(
    () => contacts.find((c) => c.id === selectedId) ?? null,
    [contacts, selectedId]
  );

  const loadContacts = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/contacts", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load contacts");
      }
      const json = (await res.json()) as { contacts: Contact[] };
      setContacts(json.contacts);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(async (contactId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/messages?contactId=${encodeURIComponent(contactId)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to load messages");
      }
      const json = (await res.json()) as { messages: Message[] };
      setMessages(json.messages);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedId]);

  /** Realtime + polling so inbox updates even if Supabase Realtime is misconfigured */
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const refreshVisible = () => {
      void loadContacts();
      const sid = selectedIdRef.current;
      if (sid) {
        void loadMessages(sid);
      }
    };

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        return;
      }

      channel = supabase
        .channel(`inbox-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const row = payload.new as Message;
            void loadContacts();
            if (row.contact_id === selectedIdRef.current) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === row.id)) {
                  return prev;
                }
                return [...prev, row].sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
              });
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "contacts",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            void loadContacts();
            const sid = selectedIdRef.current;
            if (sid) {
              void loadMessages(sid);
            }
          }
        )
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("Supabase Realtime:", status, err);
          }
        });
    })();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshVisible();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const poll = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }
      refreshVisible();
    }, POLL_MS);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(poll);
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [loadContacts, loadMessages]);

  async function send() {
    if (!selectedId || !draft.trim()) {
      return;
    }
    setSending(true);
    setAiTyping(false);
    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: selectedId, content: draft.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Send failed");
      }
      setDraft("");
      setManualMode(true);
      toast.success("Message sent — AI paused until you turn it back on.");
      await loadMessages(selectedId);
      await loadContacts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSending(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return contacts;
    }
    return contacts.filter(
      (c) =>
        c.phone.toLowerCase().includes(q) ||
        (c.name?.toLowerCase().includes(q) ?? false) ||
        (c.last_message?.toLowerCase().includes(q) ?? false)
    );
  }, [contacts, query]);

  const quickReplies = useMemo(() => ["Can I get your name?", "Would you like pricing?", "Can I help you book now?"], []);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white/80 px-8 py-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Conversations</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Inbox syncs via Supabase Realtime; also refreshes every few seconds as a fallback.
        </p>
      </header>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-full max-w-sm flex-col border-r border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
          <div className="border-b border-slate-100 p-3 dark:border-slate-800">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 dark:text-slate-400">No contacts yet.</div>
            ) : (
              filtered.map((c) => {
                const active = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`flex w-full flex-col items-start gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                      active ? "bg-emerald-50/60 dark:bg-emerald-900/20" : ""
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {c.name ?? c.phone}
                      </span>
                      <Badge tone={c.tag === "hot" ? "red" : c.tag === "warm" ? "amber" : "blue"}>{c.tag.toUpperCase()}</Badge>
                    </div>
                    <span className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{c.last_message ?? "—"}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-[#efeae2] dark:bg-slate-900">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-600 dark:text-slate-300">
              <div className="text-center">
                <p className="text-base font-semibold">Select a conversation</p>
                <p className="mt-1 text-xs opacity-80">Your AI inbox is ready to engage customers in real time.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-black/5 bg-[#f0f2f5] px-4 py-3 dark:bg-slate-950">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 text-sm font-semibold text-slate-800">
                  {(selected.name ?? selected.phone).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selected.name ?? selected.phone}
                  </div>
                  <div className="truncate text-xs text-slate-600 dark:text-slate-400">{selected.phone}</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge tone={selected.tag === "hot" ? "red" : selected.tag === "warm" ? "amber" : "blue"}>{selected.tag.toUpperCase()}</Badge>
                  <button onClick={() => setManualMode((v) => !v)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium dark:border-slate-700 dark:bg-slate-900">
                    {manualMode ? "Manual mode" : "Take over manually"}
                  </button>
                </div>
              </div>
              <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
                {loadingMsgs ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-2/3" />
                    <Skeleton className="ml-auto h-12 w-2/3" />
                    <Skeleton className="h-12 w-1/2" />
                  </div>
                ) : (
                  <div className="mx-auto flex max-w-3xl flex-col gap-2">
                    {messages.map((m) => {
                      const out = m.direction === "outgoing";
                      return (
                        <div key={m.id} className={`flex ${out ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm transition ${
                              out
                                ? "rounded-br-sm bg-[#d9fdd3] text-slate-900 dark:bg-emerald-900/40 dark:text-slate-100"
                                : "rounded-bl-sm bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">{m.content}</div>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                              <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                              <span>{out ? "Delivered" : "Received"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {aiTyping ? (
                      <div className="flex justify-start">
                        <div className="rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-xs text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                          AI is typing...
                        </div>
                      </div>
                    ) : null}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>
              <div className="border-t border-black/5 bg-[#f0f2f5] p-3 dark:bg-slate-950">
                <div className="mx-auto max-w-3xl space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((q) => (
                      <button key={q} onClick={() => setDraft(q)} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
                        {q}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={2}
                    placeholder="Type a message…"
                    className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    disabled={sending || !draft.trim()}
                    onClick={() => {
                      setAiTyping(true);
                      void send();
                    }}
                    className="self-end rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white hover:scale-[1.02] disabled:opacity-50"
                  >
                    {sending ? "…" : "Send"}
                  </button>
                </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
