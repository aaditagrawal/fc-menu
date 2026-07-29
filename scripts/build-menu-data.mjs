import { mkdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const API_BASE = (process.env.MENU_API_URL || process.env.NEXT_PUBLIC_MENU_API_URL || "https://tikm.coolstuff.work").replace(/\/$/, "");
const OUT_DIR = path.join(process.cwd(), "public", "data", "menu-bundle");

// The upstream API sits behind a CDN that serves `Cache-Control: public`
// responses for minutes at a time. This build is triggered by a deploy hook the
// moment a menu is uploaded, so a plain GET routinely reads a cached history
// from *before* the upload and bakes a bundle that is missing the new week.
// `cache: "no-store"` only bypasses Node's own fetch cache, so every request
// also gets a unique cache-key param to force an origin hit.
const BUILD_ID = Date.now().toString(36);
let requestCounter = 0;

// The deploy hook can also fire fractionally before the upload is readable, so
// a missing current week is retried before it is accepted as "not posted yet".
const CURRENT_WEEK_RETRIES = 3;
const CURRENT_WEEK_RETRY_DELAY_MS = 5_000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;

function hashContent(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function istDateKey() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function coversDate(entries, dateKey) {
  return entries.some((entry) => entry.startDate <= dateKey && dateKey <= entry.endDate);
}

async function fetchJson(url, options = {}) {
  const target = new URL(url);
  target.searchParams.set("_cb", `${BUILD_ID}-${requestCounter++}`);

  const res = await fetch(target, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  if (!res.ok) {
    if (options.optional) return null;
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

function getDateBounds(menu) {
  const dates = Object.keys(menu?.menu || {}).sort();
  if (dates.length === 0) return null;
  return { startDate: dates[0], endDate: dates[dates.length - 1] };
}

function normalizeSummary(summary, menu, type, filePath) {
  const bounds = getDateBounds(menu);
  if (!bounds) return null;

  return {
    type,
    week: menu.week || summary.week || "",
    foodCourt: menu.foodCourt || summary.foodCourt || "",
    startDate: bounds.startDate,
    endDate: bounds.endDate,
    numDays: Object.keys(menu.menu || {}).length,
    weekMonday: bounds.startDate,
    lastModified: summary.lastModified || null,
    path: filePath,
  };
}

async function writeWeek(type, summary) {
  if (!summary?.startDate) return null;

  const endpoint = type === "jain" ? "jain-menu" : "menu";
  const url = new URL(`${API_BASE}/api/${endpoint}`);
  url.searchParams.set("weekStart", summary.startDate);
  url.searchParams.set("v", "2");

  const menu = await fetchJson(url.toString(), { optional: type === "jain" });
  if (!menu || !menu.menu || Object.keys(menu.menu).length === 0) return null;

  const hash = hashContent(menu);
  const fileName = `${summary.startDate}-${hash}.json`;
  const relativePath = `/data/menu-bundle/${type}/${fileName}`;
  const absolutePath = path.join(OUT_DIR, type, fileName);
  await writeFile(absolutePath, `${JSON.stringify(menu, null, 2)}\n`);

  return normalizeSummary(summary, menu, type, relativePath);
}

async function buildType(type) {
  // Rebuilt from scratch each attempt so a retry can't leave behind week files
  // that the manifest no longer references.
  const typeDir = path.join(OUT_DIR, type);
  await rm(typeDir, { recursive: true, force: true });
  await mkdir(typeDir, { recursive: true });

  const endpoint = type === "jain" ? "jain-history" : "history";
  const history = await fetchJson(`${API_BASE}/api/${endpoint}?v=2`, { optional: type === "jain" });
  const summaries = Array.isArray(history?.weeks) ? history.weeks : [];
  const entries = [];

  for (const summary of summaries) {
    const entry = await writeWeek(type, summary);
    if (entry) entries.push(entry);
  }

  entries.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return entries;
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const today = istDateKey();
  let normal = await buildType("normal");

  for (let attempt = 1; attempt <= CURRENT_WEEK_RETRIES && !coversDate(normal, today); attempt += 1) {
    console.log(
      `No week covers ${today} (IST) after ${normal.length} weeks; retrying history in ${CURRENT_WEEK_RETRY_DELAY_MS / 1000}s (${attempt}/${CURRENT_WEEK_RETRIES})`
    );
    await sleep(CURRENT_WEEK_RETRY_DELAY_MS);
    normal = await buildType("normal");
  }

  if (!coversDate(normal, today)) {
    console.warn(`WARNING: bundle has no week covering ${today} (IST) — the app will show the stale-week notice.`);
  }

  const jain = await buildType("jain");
  const generatedAt = new Date().toISOString();
  const version = hashContent({ generatedAt, normal, jain });

  const manifest = {
    generatedAt,
    version,
    source: API_BASE,
    normal: { weeks: normal },
    jain: { weeks: jain },
  };

  await writeFile(path.join(OUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Built static menu bundle: ${normal.length} normal weeks, ${jain.length} Jain weeks`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
