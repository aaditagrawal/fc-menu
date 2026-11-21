import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterDayMenu,
  filterMeal,
  filterMenuItems,
  filterWeekMenu,
  type DietaryFilter,
} from "./filters";
import type { DayMenu, Meal, MenuItem, WeekMenu } from "./types";

const items: MenuItem[] = [
  { name: "Rice", tags: [] },
  { name: "Chicken", tags: ["non-veg"] },
  { name: "Paneer", tags: ["veg-special"] },
  { name: "Fish", tags: ["non-veg-special"] },
  { name: "Dessert", tags: ["other-special"] },
];

function mealWith(mealItems: MenuItem[]): Meal {
  return { name: "Lunch", startTime: "12:00", endTime: "14:00", items: mealItems };
}

describe("dietary filters", () => {
  it("preserves item order and untagged items for every preference", () => {
    const expected: Record<DietaryFilter, string[]> = {
      all: ["Rice", "Chicken", "Paneer", "Fish", "Dessert"],
      jain: ["Rice", "Chicken", "Paneer", "Fish", "Dessert"],
      "veg-only": ["Rice", "Paneer", "Dessert"],
      "non-veg-only": ["Rice", "Chicken", "Fish", "Dessert"],
    };
    for (const filter of Object.keys(expected) as DietaryFilter[]) {
      assert.deepEqual(
        filterMenuItems(items, filter).map((item) => item.name),
        expected[filter],
      );
    }
  });

  it("shares unchanged items, meals, days and weeks", () => {
    const meal = mealWith([items[0], items[4]]);
    const day: DayMenu = { day: "Monday", meals: { lunch: meal } };
    const week: WeekMenu = { foodCourt: "Food Court 2", week: "A week", menu: { monday: day } };
    for (const filter of ["all", "jain", "veg-only", "non-veg-only"] as const) {
      assert.equal(filterMenuItems(meal.items, filter), meal.items);
      assert.equal(filterMeal(meal, filter), meal);
      assert.equal(filterDayMenu(day, filter), day);
      assert.equal(filterWeekMenu(week, filter), week);
    }
  });

  it("copies only changed branches and leaves the source untouched", () => {
    const plain = mealWith([items[0]]);
    const mixed = mealWith(items);
    const monday: DayMenu = { day: "Monday", meals: { breakfast: plain, lunch: mixed } };
    const tuesday: DayMenu = { day: "Tuesday", meals: { lunch: plain } };
    const source: WeekMenu = {
      foodCourt: "Food Court 2",
      week: "A week",
      menu: { monday, tuesday },
    };
    const before = structuredClone(source);
    const filtered = filterWeekMenu(source, "veg-only");
    assert.notEqual(filtered, source);
    assert.notEqual(filtered.menu.monday, monday);
    assert.equal(filtered.menu.tuesday, tuesday);
    assert.equal(filtered.menu.monday.meals.breakfast, plain);
    assert.equal(filtered.menu.monday.meals.lunch?.items[0], items[0]);
    assert.deepEqual(source, before);
  });

  it("drops empty and missing meals even when filtering all or Jain items", () => {
    const lunch = mealWith([items[0]]);
    const day: DayMenu = {
      day: "Monday",
      meals: { breakfast: mealWith([]), lunch, snacks: undefined },
    };
    for (const filter of ["all", "jain", "veg-only", "non-veg-only"] as const) {
      const filtered = filterDayMenu(day, filter);
      assert.deepEqual(Object.keys(filtered.meals), ["lunch"]);
      assert.equal(filtered.meals.lunch, lunch);
      assert.ok("breakfast" in day.meals);
    }
    assert.deepEqual(
      filterDayMenu({ day: "Monday", meals: { lunch: mealWith([items[1], items[3]]) } }, "veg-only")
        .meals,
      {},
    );
  });
});
