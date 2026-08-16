"use client";

import * as React from "react";
import { ErrorState } from "@/components/ErrorState";

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
    <div className="px-4 py-8 sm:px-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <ErrorState message="Something went wrong" onRetry={reset} />
      </div>
    </div>
  );
}
