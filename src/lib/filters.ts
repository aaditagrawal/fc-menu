import type { MenuItem, Meal, DayMenu, WeekMenu } from './types';

/**
 * Dietary filter options for the menu.
 * - 'all': Show all items
 * - 'veg-only': Hide non-veg items
 * - 'non-veg-only': Hide veg-special items, keep everything else
 * - 'jain': Switch to Jain menu (handled at API level)
 */
export type DietaryFilter = 'all' | 'veg-only' | 'non-veg-only' | 'jain';

/**
 * Filter state stored in localStorage
 */
export interface FilterState {
  dietary: DietaryFilter;
}

const FILTER_STORAGE_KEY = 'menu-dietary-filter';

/**
 * Get the current filter state from localStorage.
 */
export function getFilterState(): FilterState {
  if (typeof window === 'undefined') {
    return { dietary: 'all' };
  }

  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (isValidFilter(parsed.dietary)) {
        return { dietary: parsed.dietary };
      }
    }
  } catch {
    // ignore
  }

  return { dietary: 'all' };
}

/**
 * Save the filter state to localStorage.
 */
export function setFilterState(state: FilterState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

/**
 * Check if a value is a valid dietary filter.
 */
function isValidFilter(value: unknown): value is DietaryFilter {
  return value === 'all' || value === 'veg-only' || value === 'non-veg-only' || value === 'jain';
}

/**
 * Filter menu items based on dietary preference.
 * Handles both V1 (string) and V2 (MenuItem) formats gracefully.
 */
export function filterMenuItems(items: MenuItem[], filter: DietaryFilter): MenuItem[];
export function filterMenuItems(items: string[], filter: DietaryFilter): string[];
export function filterMenuItems(items: (MenuItem | string)[], filter: DietaryFilter): (MenuItem | string)[];
export function filterMenuItems(items: (MenuItem | string)[], filter: DietaryFilter): (MenuItem | string)[] {
  if (filter === 'all' || filter === 'jain') {
    // 'jain' filter is handled at API level, show all items from Jain endpoint
    return items;
  }

  if (filter === 'veg-only') {
    // Remove items tagged as non-veg or non-veg-special
    return items.filter(item => {
      if (typeof item === 'string') return true; // V1 format, can't filter
      const tags = item.tags ?? [];
      return !tags.includes('non-veg') && !tags.includes('non-veg-special');
    });
  }

  if (filter === 'non-veg-only') {
    // Remove veg-special items, keep everything else
    return items.filter(item => {
      if (typeof item === 'string') return true; // V1 format, can't filter
      const tags = item.tags ?? [];
      return !tags.includes('veg-special');
    });
  }

  return items;
}

/**
 * Filter a meal's items based on dietary preference.
 */
export function filterMeal(meal: Meal, filter: DietaryFilter): Meal {
  return {
    ...meal,
    items: filterMenuItems(meal.items, filter)
  };
}

/**
 * Filter a day menu based on dietary preference.
 */
export function filterDayMenu(dayMenu: DayMenu, filter: DietaryFilter): DayMenu {
  const filteredMeals: DayMenu['meals'] = {} as DayMenu['meals'];

  for (const [key, meal] of Object.entries(dayMenu.meals)) {
    if (meal) {
      const filtered = filterMeal(meal, filter);
      // Only include meal if it has items after filtering
      if (filtered.items.length > 0) {
        filteredMeals[key as keyof DayMenu['meals']] = filtered;
      }
    }
  }

  return {
    ...dayMenu,
    meals: filteredMeals
  };
}

/**
 * Filter an entire week menu based on dietary preference.
 */
export function filterWeekMenu(weekMenu: WeekMenu, filter: DietaryFilter): WeekMenu {
  const filteredMenu: WeekMenu['menu'] = {};

  for (const [dateKey, dayMenu] of Object.entries(weekMenu.menu)) {
    filteredMenu[dateKey] = filterDayMenu(dayMenu, filter);
  }

  return {
    ...weekMenu,
    menu: filteredMenu
  };
}

/**
 * Check if a menu item is a special (veg-special, non-veg-special, or other-special).
 * Handles both V1 (string) and V2 (MenuItem) formats gracefully.
 */
export function isSpecial(item: MenuItem | string): boolean {
  if (typeof item === 'string') return false;
  const tags = item.tags ?? [];
  return (
    tags.includes('veg-special') ||
    tags.includes('non-veg-special') ||
    tags.includes('other-special')
  );
}

/**
 * Get the special type for a menu item.
 * Handles both V1 (string) and V2 (MenuItem) formats gracefully.
 */
export function getSpecialType(item: MenuItem | string): 'veg' | 'non-veg' | 'other' | null {
  if (typeof item === 'string') return null;
  const tags = item.tags ?? [];
  if (tags.includes('veg-special')) return 'veg';
  if (tags.includes('non-veg-special')) return 'non-veg';
  if (tags.includes('other-special')) return 'other';
  return null;
}

/**
 * Check if a menu item is non-vegetarian.
 * Handles both V1 (string) and V2 (MenuItem) formats gracefully.
 */
export function isNonVeg(item: MenuItem | string): boolean {
  if (typeof item === 'string') return false;
  const tags = item.tags ?? [];
  return tags.includes('non-veg');
}
