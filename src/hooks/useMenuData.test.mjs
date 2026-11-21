import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchWeekMenu } from "./useMenuData.ts";
import { invalidateStaticManifestCache } from "../lib/staticMenuBundle.ts";

test("a new live Jain upload is discovered when the baked manifest has no matching week", async () => {
  const originalFetch = globalThis.fetch;
  const current = { startDate: "2026-10-05", endDate: "2026-10-11" };
  const live = {
    foodCourt: "Test Jain",
    week: "Current week",
    menu: {
      "2026-10-05": {
        day: "Monday",
        meals: { lunch: { name: "Lunch", startTime: "11:30", endTime: "14:00", items: ["Rice"] } },
      },
    },
  };
  let consultedLive = false;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url === "/data/menu-bundle/manifest.json")
      return Response.json({
        normal: { weeks: [current] },
        jain: { weeks: [{ startDate: "2026-09-28", endDate: "2026-10-04" }] },
      });
    if (url.includes("/api/jain-menu?weekStart=2026-10-05")) {
      consultedLive = true;
      return Response.json(live);
    }
    throw new Error(`Unexpected request: ${url}`);
  };
  invalidateStaticManifestCache();
  try {
    const result = await fetchWeekMenu("2026-10-05", "jain");
    assert.ok(consultedLive);
    assert.equal(result.foodCourt, "Test Jain");
    assert.equal(result.menu["2026-10-05"].meals.lunch.items[0].name, "Rice");
  } finally {
    globalThis.fetch = originalFetch;
    invalidateStaticManifestCache();
  }
});
