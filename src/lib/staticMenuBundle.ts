import { formatDateKey, getISTNow } from "@/lib/date";
import type { WeekMenu } from "@/lib/types";

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
  todayIST = formatDateKey(getISTNow())
) {
  return weeks.some((week) => week.startDate <= todayIST && todayIST <= week.endDate);
}

export function selectEffectiveWeek(
  weeks: Array<{ startDate: string; endDate: string }>,
  todayIST = formatDateKey(getISTNow())
) {
  const current = weeks.find((week) => week.startDate <= todayIST && todayIST <= week.endDate);
  if (current) return current;

  const mostRecentPast = [...weeks]
    .filter((week) => week.startDate <= todayIST)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  if (mostRecentPast) return mostRecentPast;

  return [...weeks]
    .filter((week) => week.startDate > todayIST)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
}

// Several queries (weeks list, week menu, prefetches) need the manifest at the
// same time; share one in-flight/recent fetch instead of downloading it per
// query. The TTL is short so long-lived PWA sessions still pick up new weeks —
// the manifest itself is served with must-revalidate, so a refetch after the
// TTL is a cheap conditional request (304) unless a menu actually changed.
const MANIFEST_SHARE_TTL_MS = 60 * 1000;

let manifestPromise: Promise<StaticMenuManifest> | null = null;
let manifestFetchedAt = 0;

export function invalidateStaticManifestCache() {
  manifestPromise = null;
  manifestFetchedAt = 0;
}

export async function fetchStaticManifest(): Promise<StaticMenuManifest> {
  const now = Date.now();
  if (!manifestPromise || now - manifestFetchedAt > MANIFEST_SHARE_TTL_MS) {
    manifestFetchedAt = now;
    const promise: Promise<StaticMenuManifest> = fetch(STATIC_MENU_MANIFEST_PATH).then((res) => {
      if (!res.ok) throw new Error("Failed to fetch static menu manifest");
      return res.json();
    });
    manifestPromise = promise;
    promise.catch(() => {
      if (manifestPromise === promise) {
        invalidateStaticManifestCache();
      }
    });
  }
  return manifestPromise;
}

export async function fetchStaticWeek(entry: StaticWeekEntry): Promise<WeekMenu> {
  // Week files are content-hashed (a revised menu gets a new path via the
  // manifest), so the browser's HTTP cache can hold them indefinitely. The
  // path comes from the fetched manifest, so confine it to the bundle prefix
  // before handing it to fetch.
  if (!entry.path.startsWith("/data/menu-bundle/")) {
    throw new Error("Unexpected menu bundle path");
  }
  const res = await fetch(entry.path);
  if (!res.ok) throw new Error(`Failed to fetch static menu week: ${entry.startDate}`);
  return res.json();
}
