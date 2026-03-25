import type { ReactNode } from "react";

export function StatCard({
  icon,
  title,
  description,
  value,
  right,
}: {
  icon: string;
  title: string;
  description: string;
  value: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="card-premium group p-5 transition-all duration-200 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {icon} {title}
          </div>
          <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {right}
      </div>
    </div>
  );
}
