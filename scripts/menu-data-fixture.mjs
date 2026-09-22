import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export function fixtureWeek(startDate, days = 7, label = "Menu") {
  const menu = {};
  for (let day = 0; day < days; day += 1) {
    const date = new Date(`${startDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + day);
    menu[date.toISOString().slice(0, 10)] = {
      breakfast: { items: [label, "Tea", "Milk"] },
      lunch: { items: ["Rice", "Dal", "Vegetables", "Curd"] },
      dinner: { items: ["Roti", "Rice", "Dal", "Salad"] },
    };
  }
  return { week: startDate, foodCourt: "Food Court 2", menu };
}

export function fixtureApi(route, delayMs = 0) {
  const requests = [];
  let active = 0;
  let maxActive = 0;
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      const record = { url, headers: request.headers };
      requests.push(record);
      active += 1;
      maxActive = Math.max(maxActive, active);
      try {
        if (delayMs) await Bun.sleep(delayMs);
        const response = await route(url, requests);
        return response instanceof Response ? response : Response.json(response);
      } finally {
        active -= 1;
      }
    },
  });
  return {
    url: server.url.origin,
    requests,
    get maxActive() {
      return maxActive;
    },
    stop: () => server.stop(true),
  };
}

export async function readFixtureBundle(outDir) {
  const manifestContent = await readFile(path.join(outDir, "manifest.json"), "utf8");
  const manifest = JSON.parse(manifestContent);
  const files = {};
  let bytes = Buffer.byteLength(manifestContent);
  await Promise.all(
    ["normal", "jain"].map(async (type) => {
      const names = await readdir(path.join(outDir, type));
      await Promise.all(
        names.map(async (file) => {
          const content = await readFile(path.join(outDir, type, file), "utf8");
          files[`${type}/${file}`] = JSON.parse(content);
          bytes += Buffer.byteLength(content);
        }),
      );
    }),
  );
  return { manifest, files, bytes };
}
