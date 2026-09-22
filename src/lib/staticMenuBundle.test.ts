import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  fetchStaticManifest,
  fetchStaticWeek,
  invalidateStaticManifestCache,
  selectEffectiveWeek,
  weeksCoverToday,
  type StaticWeekEntry,
} from "./staticMenuBundle";

const originalFetch = globalThis.fetch;
const originalNow = Date.now;
afterEach(() => {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  invalidateStaticManifestCache();
});

const entry: StaticWeekEntry = {
  type: "normal",
  week: "A week",
  foodCourt: "Food Court 2",
  startDate: "2026-09-21",
  endDate: "2026-09-27",
  numDays: 7,
  weekMonday: "2026-09-21",
  lastModified: null,
  path: "/data/menu-bundle/normal/2026-09-21-abcdef123456.json",
};

describe("effective week selection", () => {
  it("keeps the first covering week and inclusive date boundaries", () => {
    const overlapping = { ...entry, endDate: "2026-09-29" };
    assert.equal(selectEffectiveWeek([entry, overlapping], "2026-09-21"), entry);
    assert.equal(selectEffectiveWeek([entry, overlapping], "2026-09-27"), entry);
    assert.equal(weeksCoverToday([entry], "2026-09-27"), true);
    assert.equal(weeksCoverToday([entry], "2026-09-28"), false);
  });

  it("selects the latest past week or earliest future week without reordering input", () => {
    const older = { ...entry, startDate: "2026-09-07", endDate: "2026-09-13" };
    const future = { ...entry, startDate: "2026-10-05", endDate: "2026-10-11" };
    const weeks = [future, entry, older];
    assert.equal(selectEffectiveWeek(weeks, "2026-09-30"), entry);
    assert.equal(selectEffectiveWeek(weeks, "2026-09-01"), older);
    assert.deepEqual(weeks, [future, entry, older]);
    assert.equal(selectEffectiveWeek([], "2026-09-22"), null);
  });

  it("preserves first-entry tie behavior outside the published date ranges", () => {
    const sameStart = { ...entry, path: "/different.json" };
    assert.equal(selectEffectiveWeek([entry, sameStart], "2026-09-30"), entry);
    assert.equal(selectEffectiveWeek([entry, sameStart], "2026-09-01"), entry);
  });
});

describe("static request sharing", () => {
  it("shares overlapping week requests, then allows the next refresh", async () => {
    const responses: Array<(response: Response) => void> = [];
    let requests = 0;
    globalThis.fetch = () => {
      requests += 1;
      return new Promise<Response>((resolve) => responses.push(resolve));
    };
    const first = fetchStaticWeek(entry);
    const second = fetchStaticWeek(entry);
    assert.equal(requests, 1);
    assert.equal(first, second);
    responses.shift()?.(Response.json({ version: 1 }));
    assert.deepEqual(await first, { version: 1 });
    assert.deepEqual(await second, { version: 1 });

    const refresh = fetchStaticWeek(entry);
    assert.equal(requests, 2);
    responses.shift()?.(Response.json({ version: 2 }));
    assert.deepEqual(await refresh, { version: 2 });
  });

  it("does not share requests for revised paths", async () => {
    let requests = 0;
    globalThis.fetch = async () => {
      requests += 1;
      return Response.json({});
    };
    await Promise.all([
      fetchStaticWeek(entry),
      fetchStaticWeek({ ...entry, path: "/revised.json" }),
    ]);
    assert.equal(requests, 2);
  });

  it("retries failed downloads and malformed JSON", async () => {
    let requests = 0;
    globalThis.fetch = async () => {
      requests += 1;
      if (requests === 1) return new Response(null, { status: 503 });
      if (requests === 2) return new Response("invalid JSON");
      return Response.json({ ready: true });
    };
    await assert.rejects(fetchStaticWeek(entry), /Failed to fetch/);
    await assert.rejects(fetchStaticWeek(entry), SyntaxError);
    assert.deepEqual(await fetchStaticWeek(entry), { ready: true });
    assert.equal(requests, 3);
  });

  it("reset starts a new request and an older completion cannot clear it", async () => {
    const responses: Array<(response: Response) => void> = [];
    globalThis.fetch = () => new Promise<Response>((resolve) => responses.push(resolve));
    const first = fetchStaticWeek(entry);
    invalidateStaticManifestCache();
    const refreshed = fetchStaticWeek(entry);
    assert.notEqual(first, refreshed);
    responses.shift()?.(Response.json({ version: 1 }));
    await first;
    assert.equal(fetchStaticWeek(entry), refreshed);
    responses.shift()?.(Response.json({ version: 2 }));
    assert.deepEqual(await refreshed, { version: 2 });
  });

  it("keeps the manifest TTL and explicit invalidation fresh", async () => {
    let now = 100_000;
    let requests = 0;
    Date.now = () => now;
    globalThis.fetch = async () => {
      requests += 1;
      return Response.json({ version: String(requests) });
    };
    assert.equal((await fetchStaticManifest()).version, "1");
    now += 60_000;
    assert.equal((await fetchStaticManifest()).version, "1");
    now += 1;
    assert.equal((await fetchStaticManifest()).version, "2");
    invalidateStaticManifestCache();
    assert.equal((await fetchStaticManifest()).version, "3");
  });
});
