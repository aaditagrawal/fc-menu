import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildMenuBundle } from "./build-menu-data.mjs";
import { fixtureApi, fixtureWeek, readFixtureBundle } from "./menu-data-fixture.mjs";

const cleanups = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((cleanup) => cleanup()));
});

async function setup(route, delayMs = 0) {
  const outDir = await mkdtemp(path.join(tmpdir(), "menu-bundle-test-"));
  const api = fixtureApi(route, delayMs);
  cleanups.push(
    () => api.stop(),
    () => rm(outDir, { recursive: true, force: true }),
  );
  return {
    api,
    outDir,
    build: (options = {}) =>
      buildMenuBundle({
        apiBase: api.url,
        outDir,
        today: "2026-09-22",
        retryDelayMs: 1,
        ...options,
      }),
  };
}

function summary(startDate, lastModified = "2026-09-01T00:00:00Z") {
  const end = new Date(`${startDate}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  return { startDate, endDate: end.toISOString().slice(0, 10), lastModified };
}

test("fetches both menu types concurrently within a shared six-request limit", async () => {
  const starts = ["2026-09-21", "2026-09-14", "2026-09-07", "2026-08-31", "2026-08-24"];
  const { api, outDir, build } = await setup((url) => {
    if (url.pathname.endsWith("history")) return { weeks: starts.map((date) => summary(date)) };
    return fixtureWeek(url.searchParams.get("weekStart"));
  }, 10);
  const manifest = await build();
  expect(api.maxActive).toBe(6);
  expect(api.requests).toHaveLength(12);
  expect(
    api.requests
      .slice(0, 2)
      .map(({ url }) => url.pathname)
      .toSorted(),
  ).toEqual(["/api/history", "/api/jain-history"]);
  expect(new Set(api.requests.map(({ url }) => url.searchParams.get("_cb"))).size).toBe(12);
  for (const { url, headers } of api.requests) {
    expect(url.searchParams.get("v")).toBe("2");
    expect(headers.get("cache-control")).toBe("no-cache");
    expect(headers.get("pragma")).toBe("no-cache");
  }
  for (const type of ["normal", "jain"]) {
    expect(manifest[type].weeks.map((week) => week.startDate)).toEqual(starts.toSorted());
  }
  await Promise.all(
    [...manifest.normal.weeks, ...manifest.jain.weeks].map(async (week) => {
      const raw = await readFile(path.join(outDir, week.type, path.basename(week.path)), "utf8");
      expect(JSON.parse(raw)).toEqual(fixtureWeek(week.startDate));
      expect(raw).toBe(`${JSON.stringify(fixtureWeek(week.startDate))}\n`);
      expect(week.numDays).toBe(7);
    }),
  );
});

test("retries new uploads, reuses versioned history, and removes replaced or deleted files", async () => {
  let attempts = 0;
  let jainAttempts = 0;
  const { api, outDir, build } = await setup((url) => {
    if (url.pathname === "/api/history") {
      attempts += 1;
      return {
        weeks: [
          summary("2026-09-21"),
          summary("2026-09-14", attempts === 1 ? "old" : "updated"),
          summary("2026-09-07"),
          summary("2026-08-31", null),
          ...(attempts === 1 ? [summary("2026-08-24")] : []),
        ],
      };
    }
    if (url.pathname === "/api/jain-history") {
      jainAttempts += 1;
      return { weeks: jainAttempts === 1 ? [] : [summary("2026-09-21")] };
    }
    const start = url.searchParams.get("weekStart");
    if (start === "2026-09-21" && attempts === 1) return { menu: {} };
    return fixtureWeek(start, 7, `${start}:${attempts}`);
  });
  const manifest = await build();
  expect(attempts).toBe(2);
  expect(jainAttempts).toBe(2);
  const count = (date) =>
    api.requests.filter(
      ({ url }) => url.pathname === "/api/menu" && url.searchParams.get("weekStart") === date,
    ).length;
  expect(count("2026-09-21")).toBe(2);
  expect(count("2026-09-14")).toBe(2);
  expect(count("2026-09-07")).toBe(1);
  expect(count("2026-08-31")).toBe(2);
  expect(count("2026-08-24")).toBe(1);
  expect(manifest.jain.weeks).toHaveLength(1);
  const bundle = await readFixtureBundle(outDir);
  expect(Object.keys(bundle.files).toSorted()).toEqual(
    [...manifest.normal.weeks, ...manifest.jain.weeks]
      .map((week) => `${week.type}/${path.basename(week.path)}`)
      .toSorted(),
  );
  const revised = manifest.normal.weeks.find((week) => week.startDate === "2026-09-14");
  expect(bundle.files[`normal/${path.basename(revised.path)}`]).toEqual(
    fixtureWeek("2026-09-14", 7, "2026-09-14:2"),
  );
});

test("rechecks the newest week even when its history revision stays unchanged", async () => {
  let attempts = 0;
  const { api, outDir, build } = await setup((url) => {
    if (url.pathname === "/api/history") {
      attempts += 1;
      return { weeks: [summary("2026-09-21"), summary("2026-09-14")] };
    }
    if (url.pathname === "/api/jain-history") return { weeks: [] };
    const start = url.searchParams.get("weekStart");
    return fixtureWeek(start, start === "2026-09-21" && attempts === 1 ? 1 : 7);
  });
  const manifest = await build();
  expect(attempts).toBe(2);
  expect(api.requests.filter(({ url }) => url.pathname === "/api/menu")).toHaveLength(3);
  expect(manifest.normal.weeks.at(-1).endDate).toBe("2026-09-27");
  expect(await readdir(path.join(outDir, "normal"))).toHaveLength(2);
});

test("rechecks a partial current week when a future week is already published", async () => {
  let attempts = 0;
  const { api, build } = await setup((url) => {
    if (url.pathname === "/api/history") {
      attempts += 1;
      return { weeks: [summary("2026-09-21"), summary("2026-09-28")] };
    }
    if (url.pathname === "/api/jain-history") return { weeks: [] };
    const start = url.searchParams.get("weekStart");
    return fixtureWeek(start, start === "2026-09-21" && attempts === 1 ? 1 : 7);
  });
  const manifest = await build();
  expect(attempts).toBe(2);
  expect(
    api.requests.filter(
      ({ url }) =>
        url.pathname === "/api/menu" && url.searchParams.get("weekStart") === "2026-09-21",
    ),
  ).toHaveLength(2);
  expect(manifest.normal.weeks[0].endDate).toBe("2026-09-27");
});

test("keeps all three retries when the current week never arrives and tolerates optional Jain HTTP errors", async () => {
  let attempts = 0;
  const { api, build } = await setup((url) => {
    if (url.pathname === "/api/history") {
      attempts += 1;
      return { weeks: [summary("2026-09-14"), summary("2026-09-07")] };
    }
    if (url.pathname === "/api/jain-history") return new Response("Unavailable", { status: 503 });
    return fixtureWeek(url.searchParams.get("weekStart"));
  });
  const manifest = await build();
  expect(attempts).toBe(4);
  expect(manifest.normal.weeks).toHaveLength(2);
  expect(manifest.jain.weeks).toEqual([]);
  expect(api.requests.filter(({ url }) => url.pathname === "/api/menu")).toHaveLength(5);
});

test.each(["normal", "jain-json"])(
  "fails without a manifest when the %s endpoint fails",
  async (failure) => {
    const { outDir, build } = await setup((url) => {
      if (url.pathname === "/api/history") return { weeks: [summary("2026-09-21")] };
      if (url.pathname === "/api/jain-history") {
        return failure === "jain-json" ? new Response("not JSON") : { weeks: [] };
      }
      return failure === "normal"
        ? new Response("Unavailable", { status: 503 })
        : fixtureWeek("2026-09-21");
    });
    await expect(build()).rejects.toThrow();
    expect(await Bun.file(path.join(outDir, "manifest.json")).exists()).toBe(false);
  },
);

test("versions remain stable across identical builds and change when menu content changes", async () => {
  let label = "Original";
  const { build } = await setup((url) => {
    if (url.pathname === "/api/jain-history") return { weeks: [] };
    if (url.pathname === "/api/history") return { weeks: [summary("2026-09-21")] };
    return fixtureWeek("2026-09-21", 7, label);
  });
  const first = await build();
  await Bun.sleep(2);
  const second = await build();
  expect(second.generatedAt).not.toBe(first.generatedAt);
  expect(second.version).toBe(first.version);
  expect(second.normal).toEqual(first.normal);
  label = "Revised";
  const third = await build();
  expect(third.version).not.toBe(first.version);
  expect(third.normal.weeks[0].path).not.toBe(first.normal.weeks[0].path);
});

test("aborts stalled requests and treats optional Jain transport failures as build failures", async () => {
  const { outDir, build } = await setup(async (url) => {
    if (url.pathname === "/api/history") return { weeks: [summary("2026-09-21")] };
    if (url.pathname === "/api/jain-history") {
      await Bun.sleep(100);
      return { weeks: [] };
    }
    return fixtureWeek("2026-09-21");
  });
  await expect(build({ requestTimeoutMs: 10 })).rejects.toThrow();
  expect(await Bun.file(path.join(outDir, "manifest.json")).exists()).toBe(false);
});
