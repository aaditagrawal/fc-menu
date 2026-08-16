"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { HardResetButton } from "@/components/HardResetButton";

/**
 * Shared failure state. "Try Again" is a plain retry — the boundary's reset
 * when one is provided, otherwise a reload. The hard reset lives behind a
 * separate confirmed button: making it the default would punish transient
 * failures, and offline it would wipe the only copy of the app the browser
 * can still serve.
 */
const DEFAULT_HINT =
  "If trying again doesn't help, Reset App Data clears this site's saved data and reloads from scratch.";

export function ErrorState({
  message,
  hint = DEFAULT_HINT,
  onRetry,
}: {
  message: string;
  hint?: string;
  onRetry?: () => void;
}) {
  const handleRetry = React.useCallback(() => {
    if (onRetry) {
      onRetry();
      return;
    }
    window.location.reload();
  }, [onRetry]);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="text-red-500 text-sm">{message}</div>
      {hint && (
        <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground">{hint}</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={handleRetry}>
          Try Again
        </Button>
        <HardResetButton />
      </div>
    </div>
  );
}
