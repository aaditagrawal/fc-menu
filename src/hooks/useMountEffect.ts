import { useEffect } from "react";

/**
 * Runs an effect exactly once on mount, with optional cleanup on unmount.
 * Replaces direct useEffect(..., []) to make intent explicit.
 */
export function useMountEffect(effect: () => void | (() => void)) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
