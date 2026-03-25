import type { ReactNode } from "react";

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
      {description ? <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      <div className="pt-3">{children}</div>
    </section>
  );
}
