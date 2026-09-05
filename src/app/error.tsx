"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";

import { ErrorState } from "@/components/ErrorState";

const styles = stylex.create({
  page: {
    paddingInline: {
      default: "1rem",
      "@media (min-width: 640px)": "1.5rem",
      "@media (min-width: 768px)": "2rem",
    },
    paddingBlock: "2rem",
  },
  inner: {
    marginInline: "auto",
    maxWidth: "56rem",
  },
});

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Static export has no server-side reporting; the console is the only
    // place this crash can be attributed.
    console.error(error.digest ? `Route error (digest: ${error.digest})` : "Route error", error);
  }, [error]);

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.inner)}>
        <ErrorState message="Something went wrong" onRetry={reset} />
      </div>
    </div>
  );
}
