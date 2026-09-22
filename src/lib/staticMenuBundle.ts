import { formatDateKey, getISTNow } from "@/lib/date";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import type { JsonValue } from "@/lib/json";

export type MenuType = "normal" | "jain";

export interface StaticWeekEntry {
  type: MenuType;
  week: string;
  foodCourt: string;
  startDate: string;
  endDate: string;
  numDays: number;
  weekMonday: string;
  lastModified: string | null;
  path: string;
}

export interface StaticMenuManifest {
  generatedAt: string;
  version: string;
  source: string;
  normal: { weeks: StaticWeekEntry[] };
  jain: { weeks: StaticWeekEntry[] };
}

export const STATIC_MENU_MANIFEST_PATH = "/data/menu-bundle/manifest.json";

export function getWeeksForType(manifest: StaticMenuManifest, type: MenuType) {
  return type === "jain" ? manifest.jain.weeks : manifest.normal.weeks;
}

export function normalizeWeekIdToStartDate(weekId: string | null | undefined) {
  if (!weekId) return "";
  return weekId.split("_to_")[0]?.split("_")[0] ?? "";
}

export function getWeekId(entry: StaticWeekEntry) {
  return `${entry.startDate}_to_${entry.endDate}`;
}

/**
 * The bundle is baked at deploy time, so it can only be as fresh as the last
 * build. When no baked week covers today, the bundle is behind the live API
 * (a menu was uploaded after the build) — callers use this to fall back to the
 * API instead of waiting for a redeploy.
 */
export function weeksCoverToday(
  weeks: Array<{ startDate: string; endDate: string }>,
  todayIST = formatDateKey(getISTNow()),
) {
  return weeks.some((week) => week.startDate <= todayIST && todayIST <= week.endDate);
}

export function selectEffectiveWeek<T extends { startDate: string; endDate: string }>(
  weeks: T[],
  todayIST = formatDateKey(getISTNow()),
): T | null {
  let mostRecentPast: T | null = null;
  let earliestFuture: T | null = null;
  for (const week of weeks) {
    if (week.startDate <= todayIST) {
      if (todayIST <= week.endDate) return week;
      if (!mostRecentPast || week.startDate > mostRecentPast.startDate) mostRecentPast = week;
    } else if (!earliestFuture || week.startDate < earliestFuture.startDate) {
      earliestFuture = week;
    }
  }
  return mostRecentPast ?? earliestFuture;
}

// Several queries (weeks list, week menu, prefetches) need the manifest at the
// same time; share one in-flight/recent fetch instead of downloading it per
// query. The TTL is short so long-lived PWA sessions still pick up new weeks —
// the manifest itself is served with must-revalidate, so a refetch after the
// TTL is a cheap conditional request (304) unless a menu actually changed.
const MANIFEST_SHARE_TTL_MS = 60 * 1000;

let manifestPromise: Promise<StaticMenuManifest> | null = null;
let manifestFetchedAt = 0;
const pendingWeeks = new Map<string, Promise<JsonValue>>();

export function invalidateStaticManifestCache() {
  manifestPromise = null;
  manifestFetchedAt = 0;
  pendingWeeks.clear();
}

export async function fetchStaticManifest(): Promise<StaticMenuManifest> {
  const now = Date.now();
  if (!manifestPromise || now - manifestFetchedAt > MANIFEST_SHARE_TTL_MS) {
    manifestFetchedAt = now;
    const promise: Promise<StaticMenuManifest> = fetchWithTimeout(STATIC_MENU_MANIFEST_PATH).then(
      (res) => {
        if (!res.ok) throw new Error("Failed to fetch static menu manifest");
        return res.json();
      },
    );
    manifestPromise = promise;
    promise.catch(() => {
      if (manifestPromise === promise) {
        invalidateStaticManifestCache();
      }
    });
  }
  return manifestPromise;
}

/** Undecoded on purpose — the caller runs parseWeekMenu on the payload. */
export function fetchStaticWeek(entry: StaticWeekEntry): Promise<JsonValue> {
  const pending = pendingWeeks.get(entry.path);
  if (pending) return pending;

  const promise = readStaticWeek(entry);
  pendingWeeks.set(entry.path, promise);
  // Share only overlapping requests. Completed payloads remain governed by
  // the HTTP cache, and a manual reset can immediately start a fresh request.
  const cleanup = () => {
    if (pendingWeeks.get(entry.path) === promise) pendingWeeks.delete(entry.path);
  };
  void promise.then(cleanup, cleanup);
  return promise;
}

async function readStaticWeek(entry: StaticWeekEntry): Promise<JsonValue> {
  // Week files are content-hashed (a revised menu gets a new path via the
  // manifest), so the browser's HTTP cache can hold them indefinitely.
  const res = await fetchWithTimeout(entry.path);
  if (!res.ok) throw new Error(`Failed to fetch static menu week: ${entry.startDate}`);
  return res.json();
}
