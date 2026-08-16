"use client";

import { ErrorState } from "@/components/ErrorState";
import { useMountEffect } from "@/hooks/useMountEffect";
import "./globals.css";

/**
 * This boundary replaces the root layout entirely, so nothing above it runs
 * next-themes. Read the same stored preference it would have, so the crash
 * screen doesn't flash a dark-mode user to light.
 */
function useStoredTheme() {
  useMountEffect(() => {
    try {
      const stored = window.localStorage.getItem("theme");
      const dark =
        stored === "dark" ||
        (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    } catch {}
  });
}

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useStoredTheme();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex items-center justify-center px-4">
        <ErrorState message="Something went wrong" onRetry={reset} />
      </body>
    </html>
  );
}
