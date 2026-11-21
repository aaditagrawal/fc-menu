import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { it } from "node:test";

const moduleURL = new URL("../data/weeks/index.ts", import.meta.url).href;
const week = {
  foodCourt: "Food Court 2",
  week: "September 21 - 27",
  menu: {
    "2026-09-21": {
      day: "Monday",
      meals: {
        lunch: { name: "Lunch", startTime: "12:00", endTime: "14:00", items: ["Rice"] },
      },
    },
  },
};

async function withBundle(run: (directory: string) => Promise<void>) {
  const directory = await mkdtemp(path.join(tmpdir(), "fc-menu-server-weeks-"));
  await mkdir(path.join(directory, "public", "data", "menu-bundle"), { recursive: true });
  try {
    await run(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function runReader(directory: string, source: string) {
  const result = spawnSync("bun", ["--eval", source], {
    cwd: directory,
    env: { ...process.env, WEEKS_MODULE_URL: moduleURL },
    encoding: "utf8",
    timeout: 10_000,
  });
  assert.equal(
    result.status,
    0,
    result.stderr || result.error?.message || "Reader subprocess failed",
  );
  return JSON.parse(result.stdout);
}

it("loads metadata in manifest order, skips bad files, and sees updated manifests", async () => {
  await withBundle(async (directory) => {
    const entries = [
      { startDate: "2026-09-21", endDate: "2026-09-27", path: "/good.json" },
      { startDate: "2026-09-14", endDate: "2026-09-20", path: "/missing.json" },
      { startDate: "2026-09-07", endDate: "2026-09-13", path: "/malformed.json" },
      { startDate: "2026-08-31", endDate: "2026-09-06", path: "/older.json" },
    ];
    await Promise.all([
      writeFile(
        path.join(directory, "public", "data", "menu-bundle", "manifest.json"),
        JSON.stringify({ normal: { weeks: entries } }),
      ),
      writeFile(path.join(directory, "public", "good.json"), JSON.stringify(week)),
      writeFile(path.join(directory, "public", "malformed.json"), JSON.stringify({ broken: true })),
      writeFile(
        path.join(directory, "public", "older.json"),
        JSON.stringify({ ...week, week: "Older week" }),
      ),
    ]);
    const result = runReader(
      directory,
      `
        import { writeFile } from "node:fs/promises";
        const readers = await import(process.env.WEEKS_MODULE_URL);
        globalThis.fetch = () => { throw new Error("Unexpected API fallback"); };
        const metas = await readers.getWeeksMeta();
        const latest = await readers.getLatestWeekId();
        const loaded = await readers.getWeekMenu(latest);
        await writeFile("public/data/menu-bundle/manifest.json", JSON.stringify({ normal: { weeks: [] } }));
        const updated = await readers.getAllWeeks();
        console.log(JSON.stringify({ metas, latest, loaded, updated }));
      `,
    );
    assert.deepEqual(result.metas, [
      { id: "2026-09-21_to_2026-09-27", year: "2026", foodCourt: week.foodCourt, week: week.week },
      {
        id: "2026-08-31_to_2026-09-06",
        year: "2026",
        foodCourt: week.foodCourt,
        week: "Older week",
      },
    ]);
    assert.equal(result.latest, "2026-09-21_to_2026-09-27");
    assert.deepEqual(result.loaded.menu["2026-09-21"].meals.lunch.items, [
      { name: "Rice", tags: [] },
    ]);
    assert.deepEqual(result.updated, []);
  });
});

it("retains API fallback and null first-paint data when the bundle is absent", async () => {
  await withBundle(async (directory) => {
    const result = runReader(
      directory,
      `
        const readers = await import(process.env.WEEKS_MODULE_URL);
        const requests = [];
        globalThis.fetch = async (url) => {
          requests.push(url);
          return Response.json(${JSON.stringify(week)});
        };
        const effective = await readers.getEffectiveWeekMenu();
        const metas = await readers.getWeeksMeta();
        console.log(JSON.stringify({ effective, metas, requests }));
      `,
    );
    assert.equal(result.effective, null);
    assert.deepEqual(result.metas, [
      { id: "2026-09-21_to_2026-09-21", year: "2026", foodCourt: week.foodCourt, week: week.week },
    ]);
    assert.equal(result.requests.length, 2);
    assert.equal(new URL(result.requests[1]).searchParams.get("weekStart"), "2026-09-21");
  });
});
