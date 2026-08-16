"use client";

import { ErrorState } from "@/components/ErrorState";

export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="px-4 py-8 sm:px-6 md:px-8">
      <div className="mx-auto max-w-4xl">
        <ErrorState message="Something went wrong" onRetry={reset} />
      </div>
    </div>
  );
}
