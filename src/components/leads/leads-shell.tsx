"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import type { Contact, ContactTag } from "@/lib/types/database";
import { SkeletonText } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { asStringArray } from "@/lib/lead-fields";

/** undefined = prefs loading; null = no saved preference (show all); [] = saved empty selection */
const tags: Array<ContactTag | "all"> = ["all", "hot", "warm", "cold"];

export function LeadsShell() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<ContactTag | "all">("all");
  /** Mirrors user.lead_display_fields from Supabase */
  const [displayFields, setDisplayFields] = useState<string[] | null | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDisplayPrefs() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setDisplayFields(null);
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("lead_display_fields")
        .eq("id", user.id)
        .maybeSingle();
      const raw = data?.lead_display_fields;
      if (raw === null || raw === undefined) {
        setDisplayFields(null);
      } else {
        setDisplayFields(asStringArray(raw));
      }
    }
    void loadDisplayPrefs();
  }, []);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    })();
  }, []);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (tag !== "all") {
        params.set("tag", tag);
      }
      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load leads");
      }
      const json = (await res.json()) as { contacts: Contact[] };
      setContacts(json.contacts);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      if (!opts?.silent) {
        setLoading(false);
      }
    }
  }, [tag]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("realtime-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contacts",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Realtime contact update:", payload);
          void load({ silent: true });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, load]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) {
      return contacts;
    }
    return contacts.filter(
      (c) =>
        c.phone.toLowerCase().includes(s) ||
        (c.name?.toLowerCase().includes(s) ?? false) ||
        (c.last_message?.toLowerCase().includes(s) ?? false)
    );
  }, [contacts, q]);

  function exportCsv() {
    const header = ["Name", "Phone", "Tag", "Last message"];
    const lines = [
      header.join(","),
      ...rows.map((c) =>
        [
          csvEscape(c.name ?? ""),
          csvEscape(c.phone),
          csvEscape(c.tag),
          csvEscape(c.last_message ?? ""),
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agentwats-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  function exportExcel() {
    const data = rows.map((c) => ({
      Name: c.name ?? "",
      Phone: c.phone,
      Tag: c.tag,
      "Last message": c.last_message ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `agentwats-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel exported");
  }

  return (
    <div className="p-6 opacity-100 transition-opacity duration-300 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Leads CRM</h1>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                title="Realtime updates active"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Track every opportunity 📈
              <br />
              Turn chats into real business.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Export Excel
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500/20 focus:ring-2 sm:flex-1"
          />
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase transition ${
                  tag === t
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Tag</th>
                <th className="px-4 py-3">Collected</th>
                <th className="px-4 py-3">Last message</th>
                <th className="px-4 py-3">Last active</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="border-b border-slate-50 dark:border-slate-800">
                    <td className="px-4 py-3"><SkeletonText className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><SkeletonText className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><SkeletonText className="h-5 w-14 rounded-full" /></td>
                    <td className="px-4 py-3"><SkeletonText className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><SkeletonText className="h-4 w-full max-w-md" /></td>
                    <td className="px-4 py-3"><SkeletonText className="h-4 w-40" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-slate-500 dark:text-slate-400">
                    No leads found.
                  </td>
                </tr>
              ) : (
                rows.map((c) => {
                  const fields = c.custom_fields || {};
                  const fieldEntries = Object.entries(fields).filter(([key, value]) => {
                    if (value === null || value === undefined || value === "") return false;

                    if (!displayFields || displayFields.length === 0) return true;

                    return displayFields.includes(key);
                  });
                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        router.push(`/conversations?phone=${encodeURIComponent(c.phone)}`);
                      }}
                      className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                            c.tag === "hot"
                              ? "bg-rose-100 text-rose-800"
                              : c.tag === "warm"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {c.tag}
                        </span>
                      </td>
                      <td className="max-w-[14rem] align-top px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                        {displayFields !== undefined && displayFields !== null && displayFields.length === 0 ? (
                          <span className="text-slate-400">No fields selected</span>
                        ) : fieldEntries.length === 0 ? (
                          <span className="text-slate-400 dark:text-slate-500">No data collected</span>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {fieldEntries.map(([key, value]) => (
                              <div key={key} className="leading-snug">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">{key}:</span>{" "}
                                <span className="font-normal text-slate-600 dark:text-slate-400">
                                  {typeof value === "object" && value !== null
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="max-w-md truncate px-4 py-3 text-slate-600 dark:text-slate-400">{c.last_message ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(c.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
