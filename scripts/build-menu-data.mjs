import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";

const API_BASE = (
  process.env.MENU_API_URL ||
  process.env.NEXT_PUBLIC_MENU_API_URL ||
  "https://tikm.coolstuff.work"
).replace(/\/$/, "");
const OUT_DIR = path.join(process.cwd(), "public", "data", "menu-bundle");

// The upstream API sits behind a CDN that serves `Cache-Control: public`
// responses for minutes at a time. This build is triggered by a deploy hook the
// moment a menu is uploaded, so a plain GET routinely reads a cached history
// from *before* the upload and bakes a bundle that is missing the new week.
// `cache: "no-store"` only bypasses Node's own fetch cache, so every request
// also gets a unique cache-key param to force an origin hit.
// The deploy hook can also fire fractionally before the upload is readable, so
// a missing current week is retried before it is accepted as "not posted yet".
const CURRENT_WEEK_RETRIES = 3;
const CURRENT_WEEK_RETRY_DELAY_MS = 5_000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;
const FETCH_CONCURRENCY = 6;
const REQUEST_TIMEOUT_MS = 30_000;

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

function limitRequests(limit) {
  let active = 0;
  const waiting = [];
  return async (task) => {
    if (active < limit) active += 1;
    else await new Promise((resolve) => waiting.push(resolve));
    try {
      return await task();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active -= 1;
    }
  };
}

function getDateBounds(menu) {
  const dates = Object.keys(menu?.menu || {}).toSorted();
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

export async function buildMenuBundle({
  apiBase = API_BASE,
  outDir = OUT_DIR,
  today = istDateKey(),
  retryDelayMs = CURRENT_WEEK_RETRY_DELAY_MS,
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  const buildId = Date.now().toString(36);
  const monday = new Date(`${today}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const currentWeekStart = monday.toISOString().slice(0, 10);
  let requestCounter = 0;
  let normalRetried = false;
  const request = limitRequests(FETCH_CONCURRENCY);

  function fetchJson(url, optional = false) {
    return request(async () => {
      const target = new URL(url);
      target.searchParams.set("_cb", `${buildId}-${requestCounter++}`);
      const res = await fetch(target, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      if (!res.ok) {
        if (optional) return null;
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
      }
      return res.json();
    });
  }

  async function writeWeek(type, summary) {
    if (!summary?.startDate) return null;
    const endpoint = type === "jain" ? "jain-menu" : "menu";
    const url = new URL(`${apiBase}/api/${endpoint}`);
    url.searchParams.set("weekStart", summary.startDate);
    url.searchParams.set("v", "2");
    const menu = await fetchJson(url.toString(), type === "jain");
    if (!menu || !menu.menu || Object.keys(menu.menu).length === 0) return null;

    const fileName = `${summary.startDate}-${hashContent(menu)}.json`;
    const relativePath = `/data/menu-bundle/${type}/${fileName}`;
    await writeFile(path.join(outDir, type, fileName), `${JSON.stringify(menu)}\n`);
    return normalizeSummary(summary, menu, type, relativePath);
  }

  async function buildType(type, previous = new Map()) {
    const typeDir = path.join(outDir, type);
    await mkdir(typeDir, { recursive: true });
    const endpoint = type === "jain" ? "jain-history" : "history";
    const history = await fetchJson(`${apiBase}/api/${endpoint}?v=2`, type === "jain");
    const summaries = Array.isArray(history?.weeks) ? history.weeks : [];
    const newest = summaries.reduce(
      (latest, summary) => (summary?.startDate > latest ? summary.startDate : latest),
      "",
    );
    const current = new Map();
    const weeks = await Promise.all(
      summaries.map(async (summary) => {
        const cached = previous.get(summary?.startDate);
        const signature = JSON.stringify(summary);
        // Reuse only versioned, unchanged menus whose summary and payload both
        // ended before today. Partial current-week uploads can look historical,
        // so also exclude this calendar week even when a newer future week exists.
        const reusable =
          summary?.lastModified &&
          summary.endDate &&
          summary.endDate < today &&
          summary.startDate < currentWeekStart &&
          summary.startDate !== newest &&
          cached?.signature === signature &&
          cached.entry.endDate < today;
        const entry = reusable ? cached.entry : await writeWeek(type, summary);
        if (entry) current.set(summary.startDate, { signature, entry });
        return entry;
      }),
    );
    const entries = weeks
      .filter(Boolean)
      .toSorted((a, b) => a.startDate.localeCompare(b.startDate));
    const referenced = new Set(entries.map((entry) => path.basename(entry.path)));
    // Retried uploads can replace or remove a week. Retain only files referenced
    // by this attempt, including when the refreshed history is empty.
    await Promise.all(
      (await readdir(typeDir))
        .filter((file) => !referenced.has(file))
        .map((file) => rm(path.join(typeDir, file), { force: true })),
    );
    return { entries, cache: current };
  }

  async function buildNormal() {
    let result = await buildType("normal");
    for (
      let attempt = 1;
      attempt <= CURRENT_WEEK_RETRIES && !coversDate(result.entries, today);
      attempt += 1
    ) {
      console.log(
        `No week covers ${today} (IST) after ${result.entries.length} weeks; retrying history in ${retryDelayMs / 1000}s (${attempt}/${CURRENT_WEEK_RETRIES})`,
      );
      normalRetried = true;
      // eslint-disable-next-line no-await-in-loop -- Wait for the upload before refreshing its history.
      await sleep(retryDelayMs);
      // eslint-disable-next-line no-await-in-loop -- Each retry depends on the preceding history result.
      result = await buildType("normal", result.cache);
    }
    if (!coversDate(result.entries, today)) {
      console.warn(
        `WARNING: bundle has no week covering ${today} (IST) — the app will show the stale-week notice.`,
      );
    }
    return result.entries;
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const [normal, jainResult] = await Promise.all([buildNormal(), buildType("jain")]);
  // A Jain upload may have arrived while normal history was being retried.
  // Refresh after that wait, as the sequential builder did.
  const jain = normalRetried
    ? (await buildType("jain", jainResult.cache)).entries
    : jainResult.entries;
  const generatedAt = new Date().toISOString();
  const version = hashContent({ source: apiBase, normal, jain });

  const manifest = {
    generatedAt,
    version,
    source: apiBase,
    normal: { weeks: normal },
    jain: { weeks: jain },
  };

  await writeFile(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest)}\n`);
  console.log(`Built static menu bundle: ${normal.length} normal weeks, ${jain.length} Jain weeks`);
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildMenuBundle().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
