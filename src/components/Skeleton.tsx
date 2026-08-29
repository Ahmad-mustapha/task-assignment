export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
        <div className="h-6 w-24 bg-slate-50 dark:bg-slate-800/60 rounded-full animate-pulse" />
      </div>
      <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-2" />
      <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm"
          >
            <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-2" />
            <div className="h-3 w-52 bg-slate-50 dark:bg-slate-800/60 rounded animate-pulse mb-6" />
            <div className="h-[240px] bg-slate-50 dark:bg-slate-800/60 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm">
          <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 bg-slate-50 dark:bg-slate-800/60 rounded-[10px] animate-pulse" />
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm">
          <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-10 bg-slate-50 dark:bg-slate-800/60 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-16 bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-[10px] animate-pulse"
        />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-44 bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-[10px] animate-pulse"
        />
      ))}
    </div>
  );
}
