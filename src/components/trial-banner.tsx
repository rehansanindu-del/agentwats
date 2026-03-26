"use client";

import Link from "next/link";
import { useTrial } from "@/hooks/useTrial";
import { SkeletonText } from "@/components/ui/skeleton";

export function TrialBanner() {
  const { loading, isPro, isActive, daysLeft } = useTrial();

  if (loading) {
    return (
      <div className="px-6 pt-4 md:px-8">
        <SkeletonText className="h-9 w-full rounded-xl" />
      </div>
    );
  }

  if (isPro) {
    return null;
  }

  if (isActive) {
    return (
      <div className="px-6 pt-4 md:px-8">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          🟢 Trial: {daysLeft} day{daysLeft === 1 ? "" : "s"} left
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-4 md:px-8">
      <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm md:flex-row md:items-center md:justify-between dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300">
        <div className="text-sm">
          <p className="font-semibold">🚫 Your trial has expired</p>
          <p className="text-xs opacity-90">Upgrade to continue using AI automation</p>
        </div>
        <Link
          href="/contact?plan=starter"
          className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-rose-700"
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  );
}
