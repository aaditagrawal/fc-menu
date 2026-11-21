import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fixtureApi, fixtureWeek, readFixtureBundle } from "./menu-data-fixture.mjs";

const baselineScript = process.argv[2];
if (!baselineScript) {
  throw new Error(
    "Usage: bun scripts/benchmark-menu-data.mjs /absolute/path/to/baseline-script.mjs",
  );
}

// Fixed 40 ms origin latency and 48 weeks of each menu type. This measures the
// request scheduler, independent of public API latency or CDN state.
const starts = Array.from({ length: 48 }, (_, index) => {
  const date = new Date(Date.now() + 330 * 60_000);
  date.setUTCDate(date.getUTCDate() - index * 7);
  return date.toISOString().slice(0, 10);
});
const api = fixtureApi((url) => {
  if (url.pathname.endsWith("history"))
    return { weeks: starts.map((startDate) => ({ startDate })) };
  return fixtureWeek(url.searchParams.get("weekStart"));
}, 40);
const root = await mkdtemp(path.join(tmpdir(), "menu-bundle-benchmark-"));

async function run(script, name) {
  const cwd = path.join(root, name);
  await Bun.write(path.join(cwd, ".benchmark"), "");
  const started = performance.now();
  const child = Bun.spawn([process.execPath, path.resolve(script)], {
    cwd,
    env: { ...process.env, MENU_API_URL: api.url },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [status, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  assert.equal(status, 0, `${stdout}\n${stderr}`);
  const elapsedMs = Math.round(performance.now() - started);
  return { elapsedMs, ...(await readFixtureBundle(path.join(cwd, "public/data/menu-bundle"))) };
}

try {
  const baseline = await run(baselineScript, "baseline");
  const optimized = await run(
    new URL("./build-menu-data.mjs", import.meta.url).pathname,
    "optimized",
  );
  assert.deepEqual(optimized.files, baseline.files);
  assert.deepEqual(optimized.manifest.normal, baseline.manifest.normal);
  assert.deepEqual(optimized.manifest.jain, baseline.manifest.jain);
  assert.equal(optimized.manifest.source, baseline.manifest.source);
  console.log(
    JSON.stringify(
      {
        fixture: "48 normal + 48 Jain weeks, 40 ms per API response, no retries",
        contentParity: true,
        baseline: { elapsedMs: baseline.elapsedMs, bytes: baseline.bytes },
        optimized: { elapsedMs: optimized.elapsedMs, bytes: optimized.bytes },
        speedup: `${(baseline.elapsedMs / optimized.elapsedMs).toFixed(2)}x`,
        byteReductionPercent: Number(((1 - optimized.bytes / baseline.bytes) * 100).toFixed(1)),
      },
      null,
      2,
    ),
  );
} finally {
  api.stop();
  await rm(root, { recursive: true, force: true });
}
