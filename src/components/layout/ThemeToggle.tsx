"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

import { useTheme } from "@/context/ThemeProvider";

const emptySubscribe = () => () => {};

/**
 * True once hydrated. The server cannot know the viewer's theme, so
 * useSyncExternalStore reports the server and client snapshots separately
 * without a state-setting effect.
 */
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  // Light is the default, so anything that is not explicitly dark is light.
  const isDark = theme === "dark";

  // Before hydration the theme is unknown, so the placeholder must match the
  // server exactly — including aria-label, which would otherwise differ for a
  // dark-themed viewer and trip a hydration mismatch.
  if (!hydrated) {
    return (
      <span
        aria-hidden
        className="block w-5 h-5 m-1.5"
        // Reserves the button's footprint so the header does not shift.
      />
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
