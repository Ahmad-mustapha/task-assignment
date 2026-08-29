"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  LogOut,
  Menu,
  Search,
  ChevronRight,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAdmin } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeProvider";
import { useTaskFilterStore } from "@/stores/useTaskFilterStore";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/assignees", label: "Assignees", icon: Users },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const admin = useAdmin();
  const { setTheme } = useTheme();

  const setSearch = useTaskFilterStore((state) => state.setSearch);
  const search = useTaskFilterStore((state) => state.search);

  const initials = admin.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      // The session lives in an httpOnly cookie, so only the server can
      // clear it — there is nothing in localStorage to remove.
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error();

      const body = await response.json().catch(() => ({}));
      toast.success(body.message ?? "Signed out");

      // Dark mode is a per-session preference, not a stored account setting,
      // so signing out returns the app to its primary light theme.
      setTheme("light");

      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
      setLoggingOut(false);
    }
  };

  const currentLabel =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ??
    "Dashboard";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Open navigation"
            className="p-1 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[10px] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/dashboard" className="text-lg font-black tracking-tight">
            <span className="text-[#066433]">Task Assign</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden text-slate-400 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100">
              {initials}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-50 inset-y-0 left-0 w-64 bg-[#FAFAFA] dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div>
          {/* Brand */}
          <div className="h-20 flex items-center justify-between px-6 py-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[10px] bg-[#066433] flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Task Assign
              </span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation"
              className="md:hidden p-1.5 rounded-[10px] border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="py-4 pr-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center justify-between ml-4 pl-8 pr-4 py-3 rounded-r-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#EDF2EC] dark:bg-[#066433]/15 text-[#1B4332] dark:text-[#5BBE85] dark:text-[#5BBE85] border-r-2 border-[#066433]"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-[#1B4332] dark:text-[#5BBE85] dark:text-[#5BBE85]"
                          : "text-slate-400"
                      }`}
                    />
                    {item.label}
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-[#1B4332] dark:text-[#5BBE85] dark:text-[#5BBE85]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 mt-auto mb-6 space-y-3">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center gap-2 px-4 py-3.5 w-full rounded-[10px] border border-red-50 dark:border-red-900/40 bg-white dark:bg-slate-800 text-[#ff3333] shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-60 transition-colors text-sm font-bold"
          >
            <LogOut className="w-5 h-5 rotate-180" />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64 flex-1 min-w-0 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-20 hidden md:flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 dark:text-slate-100">{currentLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  // Searching from anywhere lands on the list that shows results.
                  if (pathname !== "/tasks") router.push("/tasks");
                }}
                placeholder="Search tasks..."
                aria-label="Search tasks"
                className="pl-11 pr-4 py-2 bg-[#FBFBFB] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[10px] text-sm outline-none focus:border-[#066433] transition-all w-72 font-medium"
              />
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <ThemeToggle />
            <div className="flex items-center gap-3 pl-2 group">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  {admin.name}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Admin
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden text-slate-400 flex items-center justify-center shadow-lg shadow-slate-200 dark:shadow-slate-900 border border-slate-100 dark:border-slate-700 transition-all">
                {admin.name ? (
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {initials}
                  </span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 pt-8 md:pt-8 mt-14 md:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
