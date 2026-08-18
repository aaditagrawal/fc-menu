/**
 * Every menu fetch gets a hard per-request deadline — the static-bundle
 * attempt and the live-API fallback each get their own. Without one, a single
 * hung request holds the loading state forever and the static -> live fallback
 * chain never gets to move on. A timeout rejects like any other network
 * failure, so the existing retry and fallback behavior applies unchanged.
 */
const FETCH_TIMEOUT_MS = 15_000;

// Feature detection by presence: both statics landed well after AbortSignal
// itself, so an engine either exposes them or does not have them at all.
const hasSignalTimeout = "AbortSignal" in globalThis && "timeout" in AbortSignal;
const hasSignalAny = "AbortSignal" in globalThis && "any" in AbortSignal;

export async function fetchWithTimeout(input: string | URL, init?: RequestInit) {
  let deadline: AbortSignal;
  let cancel: (() => void) | null = null;

  if (hasSignalTimeout) {
    deadline = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  } else {
    // Older engines (Safari <16, Chrome <103) throw on AbortSignal.timeout.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    deadline = controller.signal;
    cancel = () => clearTimeout(timer);
  }

  // A caller-provided signal must keep working: combine where the platform
  // can; where it can't, the caller's abort wins over the deadline.
  const callerSignal = init?.signal;
  const signal = callerSignal
    ? hasSignalAny
      ? AbortSignal.any([callerSignal, deadline])
      : callerSignal
    : deadline;

  try {
    return await fetch(input, { ...init, signal });
  } finally {
    cancel?.();
  }
}
