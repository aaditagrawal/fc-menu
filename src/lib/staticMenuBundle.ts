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

export async function fetchStaticManifest(): Promise<StaticMenuManifest> {
  const res = await fetch(STATIC_MENU_MANIFEST_PATH, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch static menu manifest");
  return res.json();
}

export async function fetchStaticWeek(entry: StaticWeekEntry): Promise<WeekMenu> {
  const res = await fetch(entry.path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch static menu week: ${entry.startDate}`);
  return res.json();
}
