import { isJsonObject, type JsonValue } from "./json";
import { MEAL_KEYS } from "./types";
import type { MenuItem, Meal, DayMenu, WeekMenu } from "./types";

/**
 * Dietary filter options for the menu.
 * - 'all': Show all items
 * - 'veg-only': Hide non-veg items
 * - 'non-veg-only': Hide veg-special items, keep everything else
 * - 'jain': Switch to Jain menu (handled at API level)
 */
export type DietaryFilter = "all" | "veg-only" | "non-veg-only" | "jain";

/**
 * Filter state stored in localStorage
 */
export interface FilterState {
  dietary: DietaryFilter;
}

const FILTER_STORAGE_KEY = "menu-dietary-filter";

/**
 * Get the current filter state from localStorage.
 */
export function getFilterState(): FilterState {
  if (!("window" in globalThis)) {
    return { dietary: "all" };
  }

  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed: JsonValue = JSON.parse(stored);
        if (isJsonObject(parsed) && isValidFilter(parsed.dietary)) {
          return { dietary: parsed.dietary };
        }
      } catch {
        // Unparseable — fall through to removal below.
      }
      // A corrupt or outdated value would otherwise re-fail on every load.
      localStorage.removeItem(FILTER_STORAGE_KEY);
    }
  } catch {
    // localStorage itself is unavailable; nothing to clean up.
  }

  return { dietary: "all" };
}

/**
 * Save the filter state to localStorage.
 */
export function setFilterState(state: FilterState): void {
  if (!("window" in globalThis)) return;

  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * Check if a value is a valid dietary filter.
 */
function isValidFilter(value: JsonValue): value is DietaryFilter {
  return value === "all" || value === "veg-only" || value === "non-veg-only" || value === "jain";
}

/**
 * Filter menu items based on dietary preference.
 *
 * Legacy V1 payloads carried bare strings with no tags at all; parseWeekMenu
 * upgrades those to tagless MenuItems, which keeps the original behaviour that
 * an untagged item survives every filter.
 */
export function filterMenuItems(items: MenuItem[], filter: DietaryFilter): MenuItem[] {
  if (filter === "all" || filter === "jain") {
    // 'jain' filter is handled at API level, show all items from Jain endpoint
    return items;
  }

  // Keep the original array until an item actually needs removing. Besides
  // avoiding copies, this lets memoized cards reuse unchanged meals.
  let filtered: MenuItem[] | undefined;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const excluded =
      filter === "veg-only"
        ? item.tags.includes("non-veg") || item.tags.includes("non-veg-special")
        : item.tags.includes("veg-special");
    if (excluded) {
      filtered ??= items.slice(0, index);
    } else {
      filtered?.push(item);
    }
  }
  return filtered ?? items;
}

/**
 * Filter a meal's items based on dietary preference.
 */
export function filterMeal(meal: Meal, filter: DietaryFilter): Meal {
  const items = filterMenuItems(meal.items, filter);
  return items === meal.items ? meal : { ...meal, items };
}

/**
 * Filter a day menu based on dietary preference.
 */
export function filterDayMenu(dayMenu: DayMenu, filter: DietaryFilter): DayMenu {
  let filteredMeals = dayMenu.meals;

  for (const key of MEAL_KEYS) {
    const meal = dayMenu.meals[key];
    const filtered = meal ? filterMeal(meal, filter) : undefined;
    // Only include meal if it has items after filtering
    if (filtered && filtered.items.length > 0) {
      if (filtered !== meal) {
        if (filteredMeals === dayMenu.meals) filteredMeals = { ...dayMenu.meals };
        filteredMeals[key] = filtered;
      }
    } else if (key in filteredMeals) {
      if (filteredMeals === dayMenu.meals) filteredMeals = { ...dayMenu.meals };
      delete filteredMeals[key];
    }
  }

  return filteredMeals === dayMenu.meals ? dayMenu : { ...dayMenu, meals: filteredMeals };
}

/**
 * Filter an entire week menu based on dietary preference.
 */
export function filterWeekMenu(weekMenu: WeekMenu, filter: DietaryFilter): WeekMenu {
  let filteredMenu = weekMenu.menu;

  for (const [dateKey, dayMenu] of Object.entries(weekMenu.menu)) {
    const filteredDay = filterDayMenu(dayMenu, filter);
    if (filteredDay !== dayMenu) {
      if (filteredMenu === weekMenu.menu) filteredMenu = { ...weekMenu.menu };
      filteredMenu[dateKey] = filteredDay;
    }
  }

  return filteredMenu === weekMenu.menu ? weekMenu : { ...weekMenu, menu: filteredMenu };
}

/**
 * Check if a menu item is a special (veg-special, non-veg-special, or other-special).
 */
export function isSpecial(item: MenuItem): boolean {
  return (
    item.tags.includes("veg-special") ||
    item.tags.includes("non-veg-special") ||
    item.tags.includes("other-special")
  );
}

/**
 * Get the special type for a menu item.
 */
export function getSpecialType(item: MenuItem): "veg" | "non-veg" | "other" | null {
  if (item.tags.includes("veg-special")) return "veg";
  if (item.tags.includes("non-veg-special")) return "non-veg";
  if (item.tags.includes("other-special")) return "other";
  return null;
}

/**
 * Check if a menu item is non-vegetarian.
 */
export function isNonVeg(item: MenuItem): boolean {
  return item.tags.includes("non-veg");
}
