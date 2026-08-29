import { DashboardSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-56 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
      <DashboardSkeleton />
    </div>
  );
}
