import type { WeekMenu, WeekMeta } from "@/lib/types";
import { sortDateKeysAsc } from "@/lib/date";
import { selectEffectiveWeek } from "@/lib/staticMenuBundle";
import { promises as fs } from "node:fs";
import path from "node:path";

export type WeekId = string;

const API_BASE = process.env.MENU_API_URL ?? "https://tikm.coolstuff.work";
const STATIC_MANIFEST_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "menu-bundle",
  "manifest.json",
);

interface StaticWeekEntry {
  week: string;
  foodCourt: string;
  startDate: string;
  endDate: string;
  path: string;
}

interface StaticMenuManifest {
  normal: { weeks: StaticWeekEntry[] };
}

async function fetchMenuFromAPI(params?: {
  week?: string;
  weekStart?: string;
  date?: string;
}): Promise<WeekMenu> {
  const url = new URL(`${API_BASE}/api/menu`);
  url.searchParams.set("v", "2");
  if (params?.week) url.searchParams.set("week", params.week);
  if (params?.weekStart) url.searchParams.set("weekStart", params.weekStart);
  if (params?.date) url.searchParams.set("date", params.date);

  // Cache for 10 minutes on the server to reduce edge requests
  const res = await fetch(url.toString(), {
    next: { revalidate: 600 }, // Cache for 10 minutes on the server
    cache: "force-cache", // Prefer cached responses
  });

  if (!res.ok) {
    throw new Error(`Menu API error: ${res.status}`);
  }
  const data = (await res.json()) as WeekMenu;
  return data;
}

function computeWeekIdFromMenu(week: WeekMenu): WeekId {
  const keys = sortDateKeysAsc(Object.keys(week.menu));
  const start = keys[0];
  const end = keys[keys.length - 1];
  return `${start}_to_${end}`;
}

export async function getAllWeeks(): Promise<WeekId[]> {
  const manifest = await readStaticManifest();
  if (manifest) {
    return manifest.normal.weeks.map(computeWeekIdFromEntry);
  }

  const latest = await getLatestWeekId();
  return latest ? [latest] : [];
}

export async function getLatestWeekId(): Promise<WeekId> {
  const manifest = await readStaticManifest();
  if (manifest) {
    const latest = [...manifest.normal.weeks].sort((a, b) =>
      b.startDate.localeCompare(a.startDate),
    )[0];
    if (latest) return computeWeekIdFromEntry(latest);
  }

  const latestWeek = await fetchMenuFromAPI();
  return computeWeekIdFromMenu(latestWeek);
}

export async function getWeekMenu(id: WeekId): Promise<WeekMenu> {
  const start = id.split("_to_")[0] ?? id;
  const manifest = await readStaticManifest();
  const entry = manifest?.normal.weeks.find((week) => week.startDate === start);
  if (entry) {
    const filePath = path.join(process.cwd(), "public", entry.path.replace(/^\//, ""));
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as WeekMenu;
  }

  return fetchMenuFromAPI({ weekStart: start });
}

/**
 * Resolve the week that is effective at build time from the static bundle.
 * Returned data is only a first-paint seed: the client always re-derives the
 * effective week from a fresh manifest with the user's clock and replaces it.
 */
export async function getEffectiveWeekMenu(): Promise<WeekMenu | null> {
  const manifest = await readStaticManifest();
  if (!manifest) return null;

  const entry = selectEffectiveWeek(manifest.normal.weeks);
  if (!entry) return null;

  try {
    return await getWeekMenu(`${entry.startDate}_to_${entry.endDate}`);
  } catch {
    return null;
  }
}

export async function getWeeksMeta(): Promise<WeekMeta[]> {
  const ids = await getAllWeeks();
  const metas: WeekMeta[] = [];
  for (const id of ids) {
    try {
      const menu = await getWeekMenu(id);
      metas.push({ id, year: id.slice(0, 4), foodCourt: menu.foodCourt, week: menu.week });
    } catch {
      // skip
    }
  }
  return metas;
}

function computeWeekIdFromEntry(entry: StaticWeekEntry): WeekId {
  return `${entry.startDate}_to_${entry.endDate}`;
}

async function readStaticManifest(): Promise<StaticMenuManifest | null> {
  try {
    const raw = await fs.readFile(STATIC_MANIFEST_PATH, "utf-8");
    return JSON.parse(raw) as StaticMenuManifest;
  } catch {
    return null;
  }
}
