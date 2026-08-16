"use client";

import * as React from "react";
import { ErrorState } from "@/components/ErrorState";
import { geistSans, geistMono } from "./fonts";
import "./globals.css";

/**
 * This boundary replaces the root layout entirely, so nothing above it runs
 * next-themes. Apply the same stored preference in a blocking script so the
 * class is on <html> before first paint — an effect would run after it and
 * flash dark-mode users to light.
 */
const THEME_INIT = {
  __html:
    'try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}',
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Static export has no server-side reporting; the console is the only
    // place this crash can be attributed.
    console.error(error.digest ? `Root error (digest: ${error.digest})` : "Root error", error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={THEME_INIT} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex items-center justify-center px-4`}
      >
        <ErrorState message="Something went wrong" onRetry={reset} />
      </body>
    </html>
  );
}
