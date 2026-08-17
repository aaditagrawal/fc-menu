import { isJsonObject, isJsonString, type JsonValue } from "@/lib/json";
import { MEAL_KEYS } from "@/lib/types";
import type { DayMenu, Meal, MenuItem, WeekMenu } from "@/lib/types";

/**
 * A week with no days is never something to render.
 *
 * It reaches the client two ways, and neither is a real menu:
 *   - `/api/menu` and `/api/jain-menu` answer 200 with `{ menu: {} }` when
 *     their own data lookup fails, so a backend blip looks like success.
 *   - No Jain menu was uploaded for the week at all.
 *
 * Rendering that payload is what produced the "No menu days available" dead
 * end, and because it looked like a successful response it got written to the
 * persisted query cache and replayed on every subsequent visit until the
 * visitor cleared their site data by hand.
 */
export function hasMenuDays(week: WeekMenu | null | undefined): week is WeekMenu {
  return week != null && Object.keys(week.menu ?? {}).length > 0;
}

function parseStringArray(value: JsonValue): string[] {
  return Array.isArray(value) ? value.filter(isJsonString) : [];
}

/**
 * V1 payloads carried a bare string per item; V2 carries a tagged object.
 * Upgrading V1 here is what lets the rest of the app work with one item shape.
 * A legacy item has no tags, so tag-driven filters see it as plain food.
 */
function parseMenuItem(value: JsonValue): MenuItem | null {
  if (isJsonString(value)) return { name: value, tags: [] };
  if (!isJsonObject(value) || !isJsonString(value.name)) return null;
  return { name: value.name, tags: parseStringArray(value.tags) };
}

/**
 * A meal that cannot be decoded is dropped rather than failing its whole week:
 * one malformed meal is not a reason to blank a menu that otherwise renders,
 * and every reader already treats a meal lookup as optional.
 */
function parseMeal(value: JsonValue): Meal | null {
  if (!isJsonObject(value)) return null;
  const { name, startTime, endTime, items } = value;
  if (!isJsonString(name) || !isJsonString(startTime) || !isJsonString(endTime)) return null;
  if (!Array.isArray(items)) return null;

  const meal: Meal = {
    name,
    startTime,
    endTime,
    items: items.map(parseMenuItem).filter((item) => item !== null),
  };
  // Absent and empty allergens are different: readers render the section on
  // presence, so an absent list must stay absent.
  const allergens = value.allergens;
  return Array.isArray(allergens) ? { ...meal, allergens: parseStringArray(allergens) } : meal;
}

function parseDayMenu(value: JsonValue): DayMenu | null {
  if (!isJsonObject(value) || !isJsonString(value.day) || !isJsonObject(value.meals)) return null;

  const meals: DayMenu["meals"] = {};
  for (const key of MEAL_KEYS) {
    const meal = parseMeal(value.meals[key]);
    if (meal !== null) meals[key] = meal;
  }
  return { day: value.day, meals };
}

/**
 * Decode data crossing a trust boundary — a live API payload, a static bundle
 * file, or a week restored from the persisted cache — into a WeekMenu.
 *
 * `null` means the payload is not a week at all. Callers treat that as a fault
 * (bad payload, corrupted storage), not an absent menu, so it becomes a plain
 * retriable error rather than EmptyWeekError.
 */
export function parseWeekMenu(value: JsonValue): WeekMenu | null {
  if (!isJsonObject(value)) return null;
  const { foodCourt, week, menu } = value;
  if (!isJsonString(foodCourt) || !isJsonString(week) || !isJsonObject(menu)) return null;

  const days: WeekMenu["menu"] = {};
  for (const [dateKey, day] of Object.entries(menu)) {
    const parsed = parseDayMenu(day);
    if (parsed === null) return null;
    days[dateKey] = parsed;
  }
  return { foodCourt, week, menu: days };
}

/** Thrown by the week queries so an empty payload is never cached as data. */
export class EmptyWeekError extends Error {
  constructor(weekId: string | null | undefined) {
    super(`Menu week has no days: ${weekId ?? "unknown"}`);
    this.name = "EmptyWeekError";
  }
}

/**
 * True when a week query resolved to nothing usable — either it just threw
 * EmptyWeekError, or a stale empty week was restored from the persisted cache
 * that a previous version of the app wrote.
 */
export function isEmptyWeekResult(query: { data?: WeekMenu | null; error?: unknown }): boolean {
  if (query.error instanceof EmptyWeekError) return true;
  return query.data != null && !hasMenuDays(query.data);
}
