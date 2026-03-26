"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/conversations", label: "Conversations", icon: "💬" },
  { href: "/leads", label: "Leads", icon: "📋" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex h-screen w-60 flex-col overflow-hidden border-r border-gray-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">AgentWats</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">AI WhatsApp Automation for Businesses</div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 py-4">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 hover:scale-[1.01] ${
                active
                  ? "bg-green-100 font-medium text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center text-[18px] leading-none">{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            const next = !dark;
            setDark(next);
            document.documentElement.classList.toggle("dark", next);
            window.localStorage.setItem("agentwats-theme", next ? "dark" : "light");
          }}
          className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {dark ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition-all duration-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
