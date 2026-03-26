"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UserProfile() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState<string>("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    })();
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initial = email ? email[0]?.toUpperCase() : "?";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition-all duration-200 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-semibold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{email || "User"}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">Account</p>
        </div>
      </button>

      {open ? (
        <div className="absolute bottom-14 left-0 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="px-3 py-2">
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email}</p>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800" />
          <Link
            href="/settings"
            className="block px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
