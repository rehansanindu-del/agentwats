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
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
            <p className="mt-1 text-sm text-slate-500">Search, filter, and export your contacts.</p>
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
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
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

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Tag</th>
                <th className="px-4 py-3">Last message</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-slate-500">
                    No leads found.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{c.phone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                          c.tag === "hot"
                            ? "bg-rose-100 text-rose-800"
                            : c.tag === "warm"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.tag}
                      </span>
                    </td>
                    <td className="max-w-md truncate px-4 py-3 text-slate-600">{c.last_message ?? "—"}</td>
                  </tr>
                ))
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
