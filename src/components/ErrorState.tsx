"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hardResetAndReload } from "@/lib/hardReset";

/**
 * Shared failure state. "Try Again" is deliberately not a plain reload: stale
 * client state (persisted query cache, sticky filters, service-worker caches)
 * is the usual reason someone is looking at this, and a plain reload replays
 * it. This is the one-tap version of clearing site data by hand.
 *
 * When an `onRetry` is provided (the error-boundary case, where re-rendering
 * might genuinely recover), "Try Again" runs it instead and the hard reset
 * moves to a separate "Reset App Data" button.
 */
const DEFAULT_HINT = "Try Again clears this site's saved data and reloads from scratch.";
const RETRY_HINT =
  "If trying again doesn't help, Reset App Data clears this site's saved data and reloads from scratch.";

export function ErrorState({
  message,
  hint,
  onRetry,
}: {
  message: string;
  hint?: string;
  onRetry?: () => void;
}) {
  const [isResetting, setIsResetting] = React.useState(false);
  const resolvedHint = hint ?? (onRetry ? RETRY_HINT : DEFAULT_HINT);

  const handleHardReset = React.useCallback(() => {
    if (isResetting) return;
    setIsResetting(true);

    hardResetAndReload().catch(() => {
      window.location.reload();
    });
  }, [isResetting]);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="text-red-500 text-sm">{message}</div>
      {resolvedHint && (
        <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
          {resolvedHint}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry} disabled={isResetting}>
            Try Again
          </Button>
        )}
        <Button
          variant={onRetry ? "ghost" : "outline"}
          onClick={handleHardReset}
          disabled={isResetting}
          aria-busy={isResetting}
          title="Clear saved app data and reload"
        >
          {isResetting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : onRetry ? (
            "Reset App Data"
          ) : (
            "Try Again"
          )}
        </Button>
      </div>
    </div>
  );
}
