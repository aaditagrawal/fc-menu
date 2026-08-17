import type { MenuItem } from "./types";

/**
 * Exception strings that should not be rendered as menu items.
 * These are typically informational notes, warnings, or other non-food items.
 *
 * Add or remove strings from this array to control what gets filtered out.
 */
export const MENU_ITEM_EXCEPTIONS = [
  "If you are allergic to any ingredients.",
  "Note: Items in the menu may change due to non-availabilty of fresh produce.",
  "Double filtered water is used for beverages",
  "Please Inform Our Manager",
  // Add more exception strings here as needed
];

/**
 * Check if a menu item should be filtered out based on exception strings.
 * Performs a case-insensitive exact match comparison.
 */
export function shouldFilterMenuItem(item: string): boolean {
  return MENU_ITEM_EXCEPTIONS.some(
    (exception) => item.trim().toLowerCase() === exception.toLowerCase(),
  );
}

/**
 * Filter menu items to exclude exception strings. Legacy V1 payloads carried
 * bare strings here; parseWeekMenu upgrades those to MenuItem at the boundary,
 * so this only ever sees the V2 shape.
 */
export function filterMenuItems(items: MenuItem[]): MenuItem[] {
  return items.filter((item) => !shouldFilterMenuItem(item.name));
}
