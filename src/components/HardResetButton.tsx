"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hardResetAndReload } from "@/lib/hardReset";
import { cn } from "@/lib/utils";

/**
 * The one-tap version of clearing site data by hand, gated behind a two-tap
 * confirm. Arming disarms itself after a few seconds, and a confirm tap that
 * lands within the double-tap window is ignored, so one fast double-tap can't
 * arm and wipe in a single motion. Every reset affordance in the app renders
 * this button so the confirm behavior can't drift between call sites.
 */
const DISARM_AFTER_MS = 5000;
const MIN_CONFIRM_DELAY_MS = 500;

export function HardResetButton({
  className,
  size,
}: {
  className?: string;
  size?: "default" | "sm";
}) {
  const [stage, setStage] = React.useState<"idle" | "confirm" | "resetting">("idle");
  const armedAtRef = React.useRef(0);
  const disarmTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (disarmTimeoutRef.current !== null) {
        window.clearTimeout(disarmTimeoutRef.current);
      }
    },
    [],
  );

  const handleClick = React.useCallback(() => {
    if (stage === "resetting") {
      return;
    }

    if (stage === "idle") {
      armedAtRef.current = Date.now();
      setStage("confirm");
      disarmTimeoutRef.current = window.setTimeout(() => setStage("idle"), DISARM_AFTER_MS);
      return;
    }

    if (Date.now() - armedAtRef.current < MIN_CONFIRM_DELAY_MS) {
      return;
    }

    if (disarmTimeoutRef.current !== null) {
      window.clearTimeout(disarmTimeoutRef.current);
      disarmTimeoutRef.current = null;
    }
    setStage("resetting");
    hardResetAndReload().catch(() => {
      // Includes the offline refusal: a plain reload keeps the cached app up.
      window.location.reload();
    });
  }, [stage]);

  return (
    <Button
      onClick={handleClick}
      disabled={stage === "resetting"}
      variant={stage === "confirm" ? "destructive" : "ghost"}
      size={size}
      // Fixed minimum width so the label swap can't shift the layout under an
      // in-progress tap.
      className={cn("min-w-36", className)}
      title="Clear all saved app data and reload"
      aria-busy={stage === "resetting"}
    >
      {stage === "resetting" ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Resetting...
        </>
      ) : stage === "confirm" ? (
        "Confirm Reset?"
      ) : (
        "Reset App Data"
      )}
    </Button>
  );
}
