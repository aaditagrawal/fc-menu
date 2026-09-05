"use client";

import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hardResetAndReload } from "@/lib/hardReset";

/**
 * The one-tap version of clearing site data by hand, gated behind a two-tap
 * confirm. Arming disarms itself after a few seconds, and a confirm tap that
 * lands within the double-tap window is ignored, so one fast double-tap can't
 * arm and wipe in a single motion. Every reset affordance in the app renders
 * this button so the confirm behavior can't drift between call sites.
 */
const DISARM_AFTER_MS = 5000;
const MIN_CONFIRM_DELAY_MS = 500;

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const styles = stylex.create({
  // Fixed minimum width so the label swap can't shift the layout under an
  // in-progress tap.
  button: {
    minWidth: "9rem",
  },
  spinner: {
    height: "1rem",
    width: "1rem",
    marginRight: "0.5rem",
    animationName: spin,
    animationDuration: "1s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  },
});

export function HardResetButton({
  style,
  size,
}: {
  style?: stylex.StyleXStyles;
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
      style={[styles.button, style]}
      title="Clear all saved app data and reload"
      aria-busy={stage === "resetting"}
    >
      {stage === "resetting" ? (
        <>
          <Loader2 {...stylex.props(styles.spinner)} />
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
