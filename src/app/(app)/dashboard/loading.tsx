import { SkeletonCard, SkeletonText } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-2">
          <SkeletonText className="h-8 w-48" />
          <SkeletonText className="h-4 w-80" />
          <SkeletonText className="h-4 w-64" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonCard key={idx} className="h-36 w-full" />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SkeletonCard className="h-64 lg:col-span-2" />
          <SkeletonCard className="h-64" />
        </div>
      </div>
    </div>
  );
}
