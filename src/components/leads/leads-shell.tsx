"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import type { Contact, ContactTag } from "@/lib/types/database";

const tags: Array<ContactTag | "all"> = ["all", "hot", "warm", "cold"];

export function LeadsShell() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<ContactTag | "all">("all");
  const [selected, setSelected] = useState<Contact | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    void load();
  }, [load]);

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
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Leads CRM</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search, filter, segment and export your pipeline.</p>
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
                <th className="px-4 py-3">Last message</th>
                <th className="px-4 py-3">Last active</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-slate-500 dark:text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-slate-500 dark:text-slate-400">
                    No leads found.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 last:border-0">
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
                    <td className="max-w-md truncate px-4 py-3 text-slate-600 dark:text-slate-400">{c.last_message ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(c.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {selected ? (
          <div className="card-premium p-4">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Lead details</div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{selected.name ?? "Unnamed"} • {selected.phone}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selected.last_message ?? "No messages yet"}</div>
          </div>
        ) : null}
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
