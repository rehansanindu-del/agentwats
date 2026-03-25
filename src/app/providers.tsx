"use client";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
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
