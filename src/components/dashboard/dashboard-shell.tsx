"use client";

import Link from "next/link";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";

interface ActivityItem {
  id: string;
  content: string;
  direction: "incoming" | "outgoing";
  created_at: string;
}

export function DashboardShell({
  contactCount,
  messageCount,
  connected,
  recentMessages,
  dailyCounts,
}: {
  contactCount: number;
  messageCount: number;
  connected: boolean;
  recentMessages: ActivityItem[];
  dailyCounts: number[];
}) {
  const max = Math.max(...dailyCounts, 1);
  return (
    <div className="p-6 opacity-100 transition-opacity duration-300 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="mb-6 flex flex-col gap-2 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
            <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Turn conversations into customers 🚀
              <br />
              Your real-time WhatsApp growth dashboard.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/contact?plan=starter"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Upgrade Plan
            </Link>
            <Badge tone="green">AI Active</Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard icon="👥" title="Contacts" description="Total leads captured" value={<AnimatedCounter value={contactCount} />} />
          <StatCard icon="💬" title="Messages" description="All-time conversation volume" value={<AnimatedCounter value={messageCount} />} />
          <StatCard
            icon="🔌"
            title="WhatsApp"
            description={connected ? "Webhook and sending channel online" : "Complete setup in Settings"}
            value={connected ? <Badge tone="green">Connected</Badge> : <Badge tone="amber">Not connected</Badge>}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card-premium p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Messages over last 7 days</h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">You responded 92% faster than average</p>
            </div>
            <div className="mt-4 flex h-44 items-end gap-2">
              {dailyCounts.map((count, idx) => (
                <div key={`${idx}-${count}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400 transition-all duration-500" style={{ height: `${Math.max(10, (count / max) * 150)}px` }} />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">D-{6 - idx}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card-premium p-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Live activity</h2>
            <div className="mt-3 space-y-2">
              {recentMessages.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity yet.</p>
              ) : (
                recentMessages.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-200/70 bg-white/70 p-2 text-xs transition-all duration-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="line-clamp-2 text-slate-700 dark:text-slate-200">{m.content}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{m.direction === "incoming" ? "Incoming" : "Outgoing"}</span>
                      <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
