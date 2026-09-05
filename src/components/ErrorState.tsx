"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import { Button } from "@/components/ui/button";
import { HardResetButton } from "@/components/HardResetButton";

const styles = stylex.create({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBlock: "3rem",
    rowGap: "1rem",
  },
  message: {
    color: "oklch(63.7% 0.237 25.331)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
  hint: {
    maxWidth: "20rem",
    textAlign: "center",
    fontSize: "0.75rem",
    lineHeight: 1.625,
    color: "var(--muted-foreground)",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    rowGap: "0.5rem",
    columnGap: "0.5rem",
  },
});

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
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.message)}>{message}</div>
      {hint && <p {...stylex.props(styles.hint)}>{hint}</p>}
      <div {...stylex.props(styles.actions)}>
        <Button variant="outline" onClick={handleRetry}>
          Try Again
        </Button>
        <HardResetButton />
      </div>
    </div>
  );
}
