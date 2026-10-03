/** The meals a day can carry, in the order they are served. */
export const MEAL_KEYS = ["breakfast", "lunch", "snacks", "dinner"] as const;

export type MealKey = (typeof MEAL_KEYS)[number];

// V2 types (new - items with tags)
export interface MenuItem {
  name: string;
  tags: string[];
}

export interface Meal {
  name: string;
  startTime: string; // HH:mm in IST
  endTime: string; // HH:mm in IST
  items: MenuItem[];
  allergens?: string[];
}

export interface DayMenu {
  day: string; // e.g. Monday
  // Partial on purpose: a day routinely omits meals (no snacks on a Sunday), a
  // dietary filter can empty one out, and every reader already guards the
  // lookup. Declaring it total only pushed that truth into non-null assertions.
  meals: Partial<Record<MealKey, Meal>>;
}

export interface WeekMenu {
  foodCourt: string;
  week: string; // e.g. "August 18 - August 24, 2024"
  menu: Record<string, DayMenu>; // key: YYYY-MM-DD
}

export interface CurrentMealPointer {
  dateKey: string;
  mealKey: MealKey;
  isOngoing: boolean;
}

export interface WeekMeta {
  id: string;
  year: string;
  foodCourt: string;
  week: string;
}
