"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";

import { ErrorState } from "@/components/ErrorState";
import { geistSans } from "./fonts";
import "./globals.css";

const styles = stylex.create({
  body: {
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingInline: "1rem",
  },
});

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
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={THEME_INIT} />
      </head>
      <body {...stylex.props(styles.body)}>
        <ErrorState message="Something went wrong" onRetry={reset} />
      </body>
    </html>
  );
}
