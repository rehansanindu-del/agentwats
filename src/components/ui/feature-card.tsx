export function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card-premium p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
