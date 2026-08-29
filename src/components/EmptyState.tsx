import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-[10px] shadow-sm py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[#FBFBFB] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-slate-500 mt-1 font-medium max-w-sm mx-auto">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
