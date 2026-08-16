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
 */
const DEFAULT_HINT = "Try Again clears this site's saved data and reloads from scratch.";

export function ErrorState({
  message,
  hint = DEFAULT_HINT,
}: {
  message: string;
  hint?: string;
}) {
  const [isResetting, setIsResetting] = React.useState(false);

  const handleTryAgain = React.useCallback(() => {
    if (isResetting) return;
    setIsResetting(true);

    hardResetAndReload().catch(() => {
      window.location.reload();
    });
  }, [isResetting]);

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="text-red-500 text-sm">{message}</div>
      {hint && (
        <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
      <Button
        variant="outline"
        onClick={handleTryAgain}
        disabled={isResetting}
        aria-busy={isResetting}
        title="Clear saved app data and reload"
      >
        {isResetting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Resetting...
          </>
        ) : (
          "Try Again"
        )}
      </Button>
    </div>
  );
}
