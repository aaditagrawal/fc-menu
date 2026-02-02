export type MealKey = "breakfast" | "lunch" | "snacks" | "dinner";

// V1 types (legacy - items as strings)
export interface MealV1 {
  name: string;
  startTime: string; // HH:mm in IST
  endTime: string;   // HH:mm in IST
  items: string[];
}

// V2 types (new - items with tags)
export interface MenuItem {
  name: string;
  tags: string[];
}

export interface Meal {
  name: string;
  startTime: string; // HH:mm in IST
  endTime: string;   // HH:mm in IST
  items: MenuItem[];
  allergens?: string[];
}

export interface DayMenu {
  day: string; // e.g. Monday
  meals: Record<MealKey, Meal>;
}

export interface WeekMenu {
  foodCourt: string;
  week: string; // e.g. "August 18 - August 24, 2024"
  menu: Record<string, DayMenu>; // key: YYYY-MM-DD
}

// Tag types
export const SPECIAL_TAGS = ['veg-special', 'non-veg-special', 'other-special'] as const;
export const DIETARY_TAGS = ['non-veg', 'jain'] as const;

export type SpecialTag = typeof SPECIAL_TAGS[number];
export type DietaryTag = typeof DIETARY_TAGS[number];
export type MenuItemTag = SpecialTag | DietaryTag;

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


