import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Tailwind classes for the icon bubble, e.g. "bg-amber-50 border-amber-100". */
  iconClassName: string;
  iconColor: string;
  badge?: React.ReactNode;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  iconColor,
  badge,
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full border shadow-sm ${iconClassName}`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {badge}
      </div>
      <p className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-widest">
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
        {value}
      </p>
    </div>
  );
}
