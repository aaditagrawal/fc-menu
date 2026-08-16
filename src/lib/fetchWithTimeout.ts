/**
 * Every menu fetch gets a hard deadline: without one, a single hung request
 * holds the loading state forever and the static -> live fallback chain never
 * gets to move on. A timeout rejects like any other network failure, so the
 * existing retry and fallback behavior applies unchanged.
 */
const FETCH_TIMEOUT_MS = 15_000;

export function fetchWithTimeout(input: string | URL, init?: RequestInit) {
  return fetch(input, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}
