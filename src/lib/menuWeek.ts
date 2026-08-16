import type { WeekMenu } from "@/lib/types";

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

/**
 * Structural check for data crossing a trust boundary — a live API payload,
 * a static bundle file, or a week restored from the persisted cache. Anything
 * that fails is a fault (bad payload, corrupted storage), not an absent menu,
 * so callers treat it as a plain retriable error rather than EmptyWeekError.
 */
export function isValidWeekMenu(value: unknown): value is WeekMenu {
  if (typeof value !== "object" || value === null) return false;
  const { foodCourt, week, menu } = value as Record<string, unknown>;
  if (typeof foodCourt !== "string" || typeof week !== "string") return false;
  if (typeof menu !== "object" || menu === null || Array.isArray(menu)) return false;
  return Object.values(menu).every((day) => {
    if (typeof day !== "object" || day === null) return false;
    const dayMenu = day as Record<string, unknown>;
    return (
      typeof dayMenu.day === "string" &&
      typeof dayMenu.meals === "object" &&
      dayMenu.meals !== null
    );
  });
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
export function isEmptyWeekResult(query: {
  data?: WeekMenu | null;
  error?: unknown;
}): boolean {
  if (query.error instanceof EmptyWeekError) return true;
  return query.data != null && !hasMenuDays(query.data);
}
