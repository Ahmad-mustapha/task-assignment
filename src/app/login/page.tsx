"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckSquare } from "lucide-react";
import { BiSolidLockAlt } from "react-icons/bi";
import { HiMail } from "react-icons/hi";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { toast } from "sonner";
import { intervalToDuration } from "date-fns";

const SAFE_REDIRECT_PATHS = ["/dashboard", "/tasks", "/assignees"];

function safeRedirectPath(value: string | null) {
  if (
    value &&
    SAFE_REDIRECT_PATHS.some(
      (path) => value === path || value.startsWith(`${path}/`)
    )
  ) {
    return value;
  }

  return "/dashboard";
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Epoch ms when the lockout lifts, from the 429 response.
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const secondsLeft = lockedUntil
    ? Math.max(0, Math.ceil((lockedUntil - now) / 1000))
    : 0;
  const isLocked = secondsLeft > 0;

  // Ticks only while locked, and clears itself the moment the window lifts.
  useEffect(() => {
    if (!lockedUntil) return;

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) setLockedUntil(null);
    }, 1000);

    return () => clearInterval(timer);
  }, [lockedUntil]);

  const countdown = (() => {
    const { minutes = 0, seconds = 0 } = intervalToDuration({
      start: 0,
      end: secondsLeft * 1000,
    });
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  })();

  const isFormValid =
    email.trim() !== "" && password.trim() !== "" && !isLocked;

  // proxy.ts stores the blocked path here when it bounces an unauthenticated
  // request, so login can return the admin to where they were headed.
  const from = safeRedirectPath(searchParams.get("from"));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await response.json();

      if (!response.ok) {
        if (response.status === 429 && body.resetAt) {
          setLockedUntil(body.resetAt);
          setNow(Date.now());
        }

        setError(body.error ?? "Login failed. Please check your credentials.");
        return;
      }

      toast.success(body.message ?? "Signed in");

      // The session cookie is set by the server; refresh so the protected
      // layout re-runs with it and reads the new session.
      router.push(from);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 mb-2 tracking-tight">
          Welcome back
        </h1>
        <p className="text-[13px] md:text-sm text-slate-500 font-medium">
          Sign in to manage your team&apos;s tasks
        </p>
      </div>

      {isLocked ? (
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-medium rounded-xl"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🔒</span>
            Too many attempts
          </div>
          <p className="text-xs mt-1 ml-8 text-amber-600 dark:text-amber-400">
            Try again in{" "}
            <span className="font-bold tabular-nums">{countdown}</span>
          </p>
        </div>
      ) : (
        error && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl flex items-center gap-3"
          >
            <span className="text-lg">⚠️</span> {error}
          </div>
        )
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 tracking-wide"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              required
              disabled={isLocked}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:border-[#066433] transition-all placeholder:text-slate-400 font-medium text-slate-900 dark:text-slate-100"
              placeholder="e.g john@example.com"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A2A2A2]">
              <HiMail className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 tracking-wide"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={isLocked}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full pl-11 pr-12 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 outline-none focus:border-[#066433] transition-all placeholder:text-slate-400 font-medium text-slate-900 dark:text-slate-100"
              placeholder="Type in your password"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A2A2A2]">
              <BiSolidLockAlt className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? (
                <IoEyeOffOutline className="w-5 h-5" />
              ) : (
                <IoEyeOutline className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full py-4 bg-[#066433] hover:bg-[#066433]/90 disabled:bg-[#85b598] disabled:text-white text-white font-bold rounded-full transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isLocked
            ? `Locked — ${countdown}`
            : loading
              ? "Logging in..."
              : "Log in"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-[10px] bg-[#066433] flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Task Assign
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_20px_-8px_rgba(0,0,0,0.08)] p-6 md:p-8">
          <Suspense
            fallback={
              <div className="w-full">
                <div className="mb-8">
                  <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48 mb-2 animate-pulse" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-64 animate-pulse" />
                </div>
                <div className="animate-pulse space-y-6">
                  <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
                  <div className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
                  <div className="h-14 bg-[#85b598] rounded-full w-full" />
                </div>
              </div>
            }
          >
            <LoginContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
