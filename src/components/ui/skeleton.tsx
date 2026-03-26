interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-slate-800 ${className ?? ""}`} />;
}

export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={`h-4 w-full ${className ?? ""}`} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return <Skeleton className={`rounded-2xl ${className ?? ""}`} />;
}

export function SkeletonAvatar({ className }: SkeletonProps) {
  return <Skeleton className={`h-10 w-10 rounded-full ${className ?? ""}`} />;
}

export function SkeletonRow({ className }: SkeletonProps) {
  return <Skeleton className={`h-12 w-full rounded-xl ${className ?? ""}`} />;
}
