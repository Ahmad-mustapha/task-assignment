"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  CheckSquare,
  AlertCircle,
  Clock,
  Download,
  Eye,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTasksList } from "@/components/dashboard/RecentTasksList";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useTasks } from "@/hooks/useTasks";
import { buildTrends } from "@/lib/trends";
import { DASHBOARD_TASK_QUERY } from "@/lib/query-keys";
import { initials } from "@/lib/format";
import type {
  DashboardStats,
  TaskWithAssignee,
  AssigneeWithTaskCount,
  Paginated,
} from "@/types";

export function DashboardView({
  stats: initialStats,
  tasks: initialTasks,
  assignees,
}: {
  stats: DashboardStats;
  tasks: Paginated<TaskWithAssignee>;
  assignees: AssigneeWithTaskCount[];
}) {
  const [rangeDays, setRangeDays] = useState(7);
  const [isExporting, setIsExporting] = useState(false);

  // Seeded from the server render, then kept fresh by mutations invalidating
  // these keys — no loading flash on first paint.
  const { data: stats = initialStats } = useDashboardStats(initialStats);

  // Seeded with the same page the server rendered, so the charts never paint
  // from a smaller sample before a fetch lands.
  const { data: taskPage = initialTasks } = useTasks(
    DASHBOARD_TASK_QUERY,
    initialTasks
  );
  const allTasks = taskPage.items;

  const trends = useMemo(
    () => buildTrends(allTasks, rangeDays),
    [allTasks, rangeDays]
  );

  const recentTasks = useMemo(
    () =>
      [...allTasks]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [allTasks]
  );

  const topAssignees = useMemo(
    () =>
      [...assignees]
        .sort((a, b) => b._count.tasks - a._count.tasks)
        .slice(0, 5),
    [assignees]
  );

  const handleExport = () => {
    setIsExporting(true);

    try {
      let csv = "Task Assign - Dashboard Export\n";
      csv += `Generated: ${new Date().toLocaleString()}\n`;
      csv += `Time Range: last ${rangeDays} days\n\n`;

      csv += "STATISTICS SUMMARY\n";
      csv += "Metric,Value\n";
      csv += `Total Tasks,${stats.totalTasks}\n`;
      csv += `Todo,${stats.todo}\n`;
      csv += `In Progress,${stats.inProgress}\n`;
      csv += `Completed,${stats.completed}\n`;
      csv += `Total Assignees,${stats.totalAssignees}\n`;
      csv += `Overdue,${stats.overdue}\n\n`;

      csv += "DAILY TRENDS\n";
      csv += "Date,Created,Completed\n";
      trends.forEach((point) => {
        csv += `${point.date},${point.created},${point.completed}\n`;
      });
      csv += "\n";

      csv += "RECENT TASKS\n";
      csv += "Title,Assignee,Status,Priority,Due Date\n";
      recentTasks.forEach((task) => {
        csv += `"${task.title}","${task.assignee?.name ?? "Unassigned"}","${task.status}","${task.priority}","${task.dueDate ?? ""}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `dashboard-export-${rangeDays}d-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium leading-relaxed">
            Monitor task progress and team workload.
          </p>
        </div>
        <div className="flex flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <select
            value={rangeDays}
            onChange={(event) => setRangeDays(Number(event.target.value))}
            aria-label="Time range"
            className="px-4 py-2 border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-[#066433] focus:outline-none focus:ring-2 focus:ring-[#066433]/10 rounded-[10px] transition-all duration-200 cursor-pointer shadow-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 border border-slate-100 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:border-[#066433] hover:text-[#066433] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-[10px] transition-all shadow-sm active:scale-95"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#066433]" />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Tasks"
          value={stats.totalTasks}
          icon={CheckSquare}
          iconClassName="bg-[#EDF2EC] dark:bg-[#066433]/20 border-[#066433]/10"
          iconColor="text-[#066433]"
          badge={
            <span className="flex items-center gap-1 text-[10px] text-[#066433] font-bold uppercase tracking-widest bg-[#EDF2EC]/60 dark:bg-[#066433]/20 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              {stats.completed} done
            </span>
          }
        />

        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Clock}
          iconClassName="bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50"
          iconColor="text-blue-600"
          badge={
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
              {stats.todo} todo
            </span>
          }
        />

        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertCircle}
          iconClassName="bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/50"
          iconColor="text-amber-600"
          badge={
            stats.overdue > 0 ? (
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest bg-amber-50/50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                Action required
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50/50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
                All on track
              </span>
            )
          }
        />

        <StatCard
          label="Assignees"
          value={stats.totalAssignees}
          icon={Users}
          iconClassName="bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50"
          iconColor="text-indigo-600"
          badge={
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
              Team
            </span>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Tasks Created
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
              Daily new tasks ({rangeDays}d)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#066433" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#066433" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--card-foreground)",
                  padding: "8px 12px",
                  fontSize: "12px",
                  borderRadius: "6px",
                }}
              />
              <Area
                type="monotone"
                dataKey="created"
                stroke="#066433"
                strokeWidth={2}
                fill="url(#colorCreated)"
                name="Created"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Tasks Completed
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
              Daily completions ({rangeDays}d)
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--card-foreground)",
                  padding: "8px 12px",
                  fontSize: "12px",
                  borderRadius: "6px",
                }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorCompleted)"
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Status Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
              Tasks by current status
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={[
                { name: "Todo", count: stats.todo },
                { name: "In Progress", count: stats.inProgress },
                { name: "Completed", count: stats.completed },
              ]}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--card-foreground)",
                  padding: "8px 12px",
                  fontSize: "12px",
                  borderRadius: "6px",
                }}
              />
              <Bar
                dataKey="count"
                fill="#066433"
                name="Tasks"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity and Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentTasksList tasks={recentTasks} />

        <div className="bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 p-6 rounded-[10px] shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Team Workload
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">
              By assigned tasks
            </p>
          </div>
          <div className="space-y-4">
            {topAssignees.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No assignees yet.
              </p>
            ) : (
              topAssignees.map((assignee) => (
                <Link
                  href={`/assignees/${assignee.id}`}
                  key={assignee.id}
                  className="flex items-center gap-3 hover:bg-[#FBFBFB] dark:hover:bg-slate-800 -mx-2 px-2 py-1 rounded-[10px] transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-[#EDF2EC] text-[11px] font-bold text-[#1B4332] dark:text-[#5BBE85] rounded-full shrink-0">
                    {initials(assignee.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                      {assignee.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {assignee.role}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-[#066433] shrink-0">
                    {assignee._count.tasks}
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link
            href="/assignees"
            className="mt-6 w-full py-3.5 px-4 border border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:border-[#066433] hover:text-[#066433] transition-all flex items-center justify-center gap-2 rounded-[10px] bg-white dark:bg-slate-900 shadow-sm"
          >
            <Eye className="w-4 h-4" />
            View All Assignees
          </Link>
        </div>
      </div>
    </div>
  );
}
