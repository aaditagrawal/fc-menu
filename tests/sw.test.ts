import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const origin = "https://menu.example";
const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

interface WorkerRequest {
  url: string;
  method: string;
  mode: RequestMode;
  destination: RequestDestination;
}

interface WorkerFetchEvent {
  request: WorkerRequest;
  respondWith: (response: Promise<Response>) => void;
  waitUntil: (work: Promise<void>) => void;
}

interface WorkerOptions {
  fetch?: (request: WorkerRequest) => Promise<Response>;
  beforePut?: Promise<void>;
  cacheError?: Error;
}

function createWorker(options: WorkerOptions = {}) {
  const entries = new Map<string, Response>();
  const fetched: string[] = [];
  const listeners = new Map<string, (event: WorkerFetchEvent) => void>();
  const key = (request: WorkerRequest | string) =>
    new URL(typeof request === "string" ? request : request.url, origin).href;

  runInNewContext(source, {
    URL,
    Response,
    self: {
      location: new URL(origin),
      addEventListener: (type: string, listener: (event: WorkerFetchEvent) => void) => {
        listeners.set(type, listener);
      },
    },
    caches: {
      match: async (request: WorkerRequest | string) => entries.get(key(request))?.clone(),
      open: async () => ({
        put: async (request: WorkerRequest, response: Response) => {
          await options.beforePut;
          if (options.cacheError) throw options.cacheError;
          entries.set(key(request), response.clone());
        },
      }),
    },
    fetch: (request: WorkerRequest) => {
      fetched.push(request.url);
      return options.fetch ? options.fetch(request) : Promise.resolve(new Response("fresh"));
    },
  });

  return {
    entries,
    fetched,
    seed(path: string, body: string) {
      entries.set(new URL(path, origin).href, new Response(body));
    },
    request(path: string, overrides: Partial<WorkerRequest> = {}) {
      const background: Promise<void>[] = [];
      let response: Promise<Response> | undefined;
      listeners.get("fetch")?.({
        request: {
          url: new URL(path, origin).href,
          method: "GET",
          mode: "cors",
          destination: "",
          ...overrides,
        },
        respondWith(result) {
          response = result;
        },
        waitUntil(work) {
          background.push(work);
        },
      });
      return {
        response,
        background,
        async finish() {
          await response;
          // Background fetches can register cache writes after this wait begins.
          for (let i = 0; i < background.length; i++) await background[i];
        },
      };
    },
  };
}

test("warm immutable build and menu assets make no network requests", async () => {
  const worker = createWorker();
  for (const path of [
    "/_next/static/chunks/a1b2c3.js",
    "/_next/static/css/a1b2c3.css",
    "/_next/static/media/font-a1b2c3.woff2",
    "/data/menu-bundle/week-a1b2c3.json",
  ]) {
    worker.seed(path, "cached");
    const event = worker.request(path);
    assert.equal(await (await event.response)?.text(), "cached");
    await event.finish();
  }
  assert.deepEqual(worker.fetched, []);
});

test("cold immutable assets are fetched once and cached for the next visit", async () => {
  const worker = createWorker();
  for (const path of ["/_next/static/chunks/a1b2c3.js", "/data/menu-bundle/week-a1b2c3.json"]) {
    const first = worker.request(path);
    assert.equal(await (await first.response)?.text(), "fresh");
    await first.finish();
    const second = worker.request(path);
    assert.equal(await (await second.response)?.text(), "fresh");
    await second.finish();
  }
  assert.equal(worker.fetched.length, 2);
});

test("mutable icons serve the cached response and refresh in the background", async () => {
  let resolveFetch: (response: Response) => void = () => {};
  const worker = createWorker({
    fetch: () => new Promise<Response>((resolve) => (resolveFetch = resolve)),
  });
  worker.seed("/icon-192.png", "old icon");
  const event = worker.request("/icon-192.png", { destination: "image" });
  assert.equal(await (await event.response)?.text(), "old icon");
  assert.equal(worker.fetched.length, 1);
  assert.ok(event.background.length > 0, "background refresh must extend the event lifetime");
  resolveFetch(new Response("new icon"));
  await event.finish();
  assert.equal(await worker.entries.get(`${origin}/icon-192.png`)?.text(), "new icon");
});

test("all network cache writes extend the event lifetime without delaying the response", async () => {
  for (const [path, mode] of [
    ["/", "navigate"],
    ["/data/menu-bundle/manifest.json", "cors"],
    ["/data/menu-bundle/week-a1b2c3.json", "cors"],
    ["/_next/static/chunks/a1b2c3.js", "cors"],
    ["/icon-192.png", "cors"],
    ["https://api.example/menu", "cors"],
  ] satisfies [string, RequestMode][]) {
    let finishPut: () => void = () => {};
    const worker = createWorker({
      beforePut: new Promise<void>((resolve) => (finishPut = resolve)),
    });
    const event = worker.request(path, { mode });
    assert.equal(await (await event.response)?.text(), "fresh");
    assert.equal(worker.entries.size, 0);
    assert.ok(event.background.length > 0, `${path} must keep its cache write alive`);
    finishPut();
    await event.finish();
    assert.equal(worker.entries.size, 1);
  }
});

test("manifest, navigation, and API requests prefer fresh network responses", async () => {
  const worker = createWorker();
  for (const path of ["/", "/data/menu-bundle/manifest.json", "https://api.example/menu"]) {
    worker.seed(path, "old");
    const event = worker.request(path, { mode: path === "/" ? "navigate" : "cors" });
    assert.equal(await (await event.response)?.text(), "fresh");
    await event.finish();
  }
  assert.equal(worker.fetched.length, 3);
});

test("offline requests retain cached manifest, navigation, API, and mutable assets", async () => {
  const worker = createWorker({
    fetch: async () => {
      throw new TypeError("offline");
    },
  });
  for (const path of [
    "/",
    "/data/menu-bundle/manifest.json",
    "/icon-192.png",
    "https://api.example/menu",
  ]) {
    worker.seed(path, "cached offline");
    const event = worker.request(path, { mode: path === "/" ? "navigate" : "cors" });
    assert.equal(await (await event.response)?.text(), "cached offline");
    await event.finish();
  }
  const navigation = worker.request("/uncached-page", { mode: "navigate" });
  assert.equal(await (await navigation.response)?.text(), "cached offline");
  await navigation.finish();
});

test("an uncached offline API or icon returns a network error response", async () => {
  const worker = createWorker({
    fetch: async () => {
      throw new TypeError("offline");
    },
  });
  for (const path of ["https://api.example/menu", "/icon-192.png"]) {
    const event = worker.request(path);
    assert.equal((await event.response)?.type, "error");
    await event.finish();
  }
});

test("cache storage failure does not reject the response or background work", async () => {
  const worker = createWorker({ cacheError: new Error("quota exceeded") });
  const event = worker.request("/_next/static/chunks/a1b2c3.js");
  assert.equal(await (await event.response)?.text(), "fresh");
  await event.finish();
  assert.equal(worker.entries.size, 0);
});

test("failed HTTP responses do not replace cached assets", async () => {
  const worker = createWorker({ fetch: async () => new Response("unavailable", { status: 503 }) });
  worker.seed("/icon-192.png", "cached");
  const event = worker.request("/icon-192.png");
  assert.equal(await (await event.response)?.text(), "cached");
  await event.finish();
  assert.equal(await worker.entries.get(`${origin}/icon-192.png`)?.text(), "cached");
});

test("unrelated same-origin API calls and non-GET requests are not intercepted", () => {
  const worker = createWorker();
  assert.equal(worker.request("/api/health").response, undefined);
  assert.equal(
    worker.request("/data/menu-bundle/manifest.json", { method: "POST" }).response,
    undefined,
  );
  assert.deepEqual(worker.fetched, []);
});
