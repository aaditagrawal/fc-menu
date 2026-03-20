import { useEffect } from "react";

/**
 * Runs an effect on mount with optional cleanup on unmount.
 * In development Strict Mode, React runs setup/cleanup an extra time.
 * Replaces direct useEffect(..., []) to make intent explicit.
 */
export function useMountEffect(effect: () => void | (() => void)) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
