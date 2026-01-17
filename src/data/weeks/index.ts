import type { WeekMenu, WeekMeta } from "@/lib/types";
import { sortDateKeysAsc } from "@/lib/date";

export type WeekId = string;

const API_BASE = process.env.MENU_API_URL ?? "https://tikm.coolstuff.work";

async function fetchMenuFromAPI(params?: { week?: string; weekStart?: string; date?: string }): Promise<WeekMenu> {
  const url = new URL(`${API_BASE}/api/menu`);
  if (params?.week) url.searchParams.set("week", params.week);
  if (params?.weekStart) url.searchParams.set("weekStart", params.weekStart);
  if (params?.date) url.searchParams.set("date", params.date);

  // Cache for 10 minutes on the server to reduce edge requests
  const res = await fetch(url.toString(), {
    next: { revalidate: 600 }, // Cache for 10 minutes on the server
    cache: 'force-cache', // Prefer cached responses
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
  // Minimal implementation: return only the latest available week id.
  const latest = await getLatestWeekId();
  return latest ? [latest] : [];
}

export async function getLatestWeekId(): Promise<WeekId> {
  const latestWeek = await fetchMenuFromAPI();
  return computeWeekIdFromMenu(latestWeek);
}

export async function getWeekMenu(id: WeekId): Promise<WeekMenu> {
  const start = id.split("_to_")[0] ?? id;
  return fetchMenuFromAPI({ weekStart: start });
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

