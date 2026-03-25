"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("agentwats-theme");
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    window.localStorage.setItem("agentwats-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <>
      <div data-theme-toggle={dark ? "dark" : "light"}>
        {children}
      </div>
      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setDark((v) => !v)}
        className="fixed bottom-4 right-4 z-[120] rounded-full border border-slate-200 bg-white/90 p-2 text-slate-700 shadow-soft transition hover:scale-105 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        {dark ? "☀️" : "🌙"}
      </button>
      <Toaster
        richColors
        position="top-center"
        closeButton
        toastOptions={{
          classNames: {
            toast: "shadow-lg border border-slate-200",
          },
        }}
        className="z-[200]"
      />
    </>
  );
}
