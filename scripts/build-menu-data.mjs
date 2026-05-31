import { mkdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const API_BASE = (process.env.MENU_API_URL || process.env.NEXT_PUBLIC_MENU_API_URL || "https://tikm.coolstuff.work").replace(/\/$/, "");
const OUT_DIR = path.join(process.cwd(), "public", "data", "menu-bundle");

function hashContent(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, { cache: "no-store" });
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
  await mkdir(path.join(OUT_DIR, "normal"), { recursive: true });
  await mkdir(path.join(OUT_DIR, "jain"), { recursive: true });

  const normal = await buildType("normal");
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
